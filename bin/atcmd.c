#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>
#include <unistd.h>
#include <fcntl.h>
#include <errno.h>
#include <sys/time.h>
#include <sys/file.h>
#include <sys/poll.h>

#define DEV_PATH "/dev/smd11"
#define MAX_INPUT_SIZE 1024
#define MAX_OUTPUT_SIZE (MAX_INPUT_SIZE * 4)

static bool is_final(const char* const buf)
{
  return strstr(buf, "OK\r\n") ||
    strstr(buf, "ERROR\r\n") ||
    strstr(buf, "CME ERROR:") ||
    strstr(buf, "CMS ERROR:") ||
    strstr(buf, "BUSY\r\n") ||
    strstr(buf, "NO ANSWER\r\n") ||
    strstr(buf, "NO CARRIER\r\n") ||
    strstr(buf, "NO DIALTONE\r\n");
}

int atc_recv_sync(int at_fd, int timeout_sec)
{
  int ret;
  struct pollfd fds[] = {{ .fd = at_fd, .events = POLLIN }};

  do {
    ret = poll(fds, 1, timeout_sec * 1000);
    if(ret == -1) {
      perror("poll");
      return -1;
    }

    if(ret == 0) {
      printf("TIMEOUT\r\n");
      break;
    }
    
    if (fds[0].revents & POLLIN) {
      char buf[MAX_OUTPUT_SIZE] = { 0 };

      ret = read(at_fd, buf, MAX_OUTPUT_SIZE - 1);
      if (ret > 0) {
        printf("%s\r\n", buf);
        if (is_final(buf)) {
          break;
        }
      } else if (ret == 0) {
        lseek(at_fd, 0, SEEK_SET);
        break;
      } else {
        perror("read");
        return -1;
      }
    }
  } while (1);

  return 0;
}

int atc_send_sync(int at_fd, const char* const buf)
{
  int ret;

  ret = write(at_fd, buf, strlen(buf));
  if (ret == -1) {
    perror("write");
    return -1;
  }

  return 0;
}

int main(int argc, char *argv[])
{
  int opt, timeout = 10, at_fd, errflg = 0, ret = 0;
  char buf[MAX_INPUT_SIZE] = { 0 };

  while ((opt = getopt(argc, argv, ":t:")) != -1) {
    switch (opt) {
      case 't':
        timeout = atoi(optarg);
        if (timeout <= 0 || timeout > 180) {
          fprintf(stderr, "Timeout must be positive value between 1 and 180 seconds\n");
          errflg++;
        }
        break;
      case ':':
        fprintf(stderr, "Option -%c requires an operand\n", optopt);
        errflg++;
        break;
      case '?':
        fprintf(stderr, "Unrecognized option -%c\n", optopt);
        errflg++;
    }
    if (errflg) {
      fprintf(stderr, "Usage: %s [-t <timeout>]\n", argv[0]);
      return 2;
    }
  }

  at_fd = open(DEV_PATH, O_RDWR, 0644);
  if(at_fd == 0) {
    perror("open");
    return -1;
  }

  ret = flock(at_fd, LOCK_EX);
  if (ret == -1) {
    perror("flock");
    return ret;
  }

  while (fgets(buf, sizeof(buf), stdin) != NULL) {
    ret = atc_send_sync(at_fd, buf);
    if (ret == -1) {
      break;
    }

    ret = atc_recv_sync(at_fd, timeout);
    if (ret == -1) {
      break;
    }
  }

  close(at_fd);

  return ret;
}
