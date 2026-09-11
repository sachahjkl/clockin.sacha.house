namespace "staging" {
  capabilities = ["list-jobs", "parse-job", "read-job", "submit-job"]
}

host_volume "clockin-sacha-house-staging-data" {
  policy = "write"
}
