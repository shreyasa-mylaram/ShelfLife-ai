import subprocess

result = subprocess.run(["docker", "logs", "--tail", "100", "shelflife-backend"], capture_output=True, text=True)
with open("logs.txt", "w") as f:
    f.write(result.stdout)
    f.write("\n--- ERRORS ---\n")
    f.write(result.stderr)
