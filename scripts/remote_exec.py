import paramiko
import os
import sys

def execute_remote(host, user, password, commands=None, uploads=None):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(host, username=user, password=password)
        print(f"Connected to {host}")
        
        if uploads:
            sftp = client.open_sftp()
            for local_path, remote_path in uploads:
                print(f"Uploading {local_path} to {remote_path}")
                # Ensure remote directory exists
                remote_dir = os.path.dirname(remote_path)
                try:
                    sftp.stat(remote_dir)
                except IOError:
                    # Very basic recursive mkdir
                    path_parts = remote_dir.split('/')
                    current_path = ""
                    for part in path_parts:
                        if not part: continue
                        current_path += "/" + part
                        try:
                            sftp.stat(current_path)
                        except IOError:
                            sftp.mkdir(current_path)
                sftp.put(local_path, remote_path)
            sftp.close()

        if commands:
            for cmd in commands:
                print(f"Executing: {cmd}")
                stdin, stdout, stderr = client.exec_command(cmd)
                
                for line in stdout:
                    try:
                        print(line, end='')
                    except UnicodeEncodeError:
                        print(line.encode('ascii', 'ignore').decode('ascii'), end='')
                
                err = stderr.read().decode()
                if err:
                    print(f"Error: {err}", file=sys.stderr)
                    
                exit_status = stdout.channel.recv_exit_status()
                if exit_status != 0:
                    print(f"Command failed with status {exit_status}")
                    return exit_status
                
        return 0
    except Exception as e:
        print(f"Operation failed: {e}")
        import traceback
        traceback.print_exc()
        return 1
    finally:
        client.close()

if __name__ == "__main__":
    host = "82.112.255.193"
    user = "root"
    password = r"HaQr7k;q'lEk(DbKp+-9"
    
    # Example usage for initialization
    # python scripts/remote_exec.py --init
    if "--init" in sys.argv:
        commands = [
            "mkdir -p ~/footapp_project",
            "cd ~/footapp_project && git init && git config receive.denyCurrentBranch ignore"
        ]
        sys.exit(execute_remote(host, user, password, commands))
    elif "--upload-config" in sys.argv:
        # Uploading critical files
        uploads = [
            ("docker-compose.traefik.yml", "/root/footapp_project/docker-compose.traefik.yml"),
            ("docker-compose.prod.yml", "/root/footapp_project/docker-compose.prod.yml"),
            ("Dockerfile", "/root/footapp_project/Dockerfile"),
            ("requirements.txt", "/root/footapp_project/requirements.txt"),
            (".env.prod.example", "/root/footapp_project/.env.prod"),
            ("app/__init__.py", "/root/footapp_project/app/__init__.py"),
            ("app/routes/main.py", "/root/footapp_project/app/routes/main.py"),
            ("app/templates/errors/500.html", "/root/footapp_project/app/templates/errors/500.html"),
            ("app/templates/base.html", "/root/footapp_project/app/templates/base.html"),
            ("app/services/seed_data.py", "/root/footapp_project/app/services/seed_data.py"),
        ]
        sys.exit(execute_remote(host, user, password, uploads=uploads))
    else:
        # Custom command
        cmd = sys.argv[1] if len(sys.argv) > 1 else "uptime"
        sys.exit(execute_remote(host, user, password, commands=[cmd]))
