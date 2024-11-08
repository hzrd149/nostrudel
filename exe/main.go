package main

import (
	"embed"
	"fmt"
	"io/fs"
	"net/http"
	"os/exec"
	"runtime"
)

//go:embed web/*
var webFiles embed.FS

func openBrowser(url string) {
  var cmd string
  var args []string

  switch runtime.GOOS {
  case "windows":
    cmd = "cmd"
    args = []string{"/c", "start"}
  case "darwin":
    cmd = "open"
  default:
    cmd = "xdg-open"
  }
  args = append(args, url)
  exec.Command(cmd, args...).Start()
}

func main() {
  // Create a filesystem rooted at the 'web' directory
  fsys, err := fs.Sub(webFiles, "web")
  if err != nil {
    panic(err)
  }

  // Serve the embedded files
  http.Handle("/", http.FileServer(http.FS(fsys)))

  port := "3149"
  fmt.Printf("Starting server at http://localhost:%s\n", port)

  // Open browser automatically
  openBrowser("http://localhost:" + port)

  // Start server
  if err := http.ListenAndServe(":"+port, nil); err != nil {
    panic(err)
  }
}
