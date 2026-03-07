import subprocess

def run_cmd(cmd):
    return subprocess.check_output(cmd, shell=True).decode('utf-8')

try:
    print("Unpushed commits:")
    print(run_cmd("git log --oneline origin/main..HEAD"))
    
    print("\nFiles changing in these commits involving 'venv':")
    print(run_cmd("git log --name-status origin/main..HEAD | findstr venv"))
except Exception as e:
    print(e)
