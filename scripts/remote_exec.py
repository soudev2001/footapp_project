import paramiko
import sys
import os

def run_ssh_command(host, user, password, commands):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(host, username=user, password=password, timeout=30)
        
        for cmd in commands:
            print(f"Executing: {cmd}")
            stdin, stdout, stderr = client.exec_command(cmd)
            stdout_str = stdout.read().decode('utf-8').strip()
            stderr_str = stderr.read().decode('utf-8').strip()
            
            if stdout_str:
                print(f"OUT: {stdout_str}")
            if stderr_str:
                print(f"ERR: {stderr_str}")
                
            # Check exit status
            exit_status = stdout.channel.recv_exit_status()
            if exit_status != 0:
                print(f"Command failed with exit status {exit_status}")
                return False
                
        return True
    except Exception as e:
        print(f"SSH Connection Error: {str(e)}")
        return False
    finally:
        client.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python deploy_on_server.py '<command1>' '<command2>' ...")
        sys.exit(1)
        
    HOST = "82.112.255.193"
    USER = "root"
    PASS = "HaQr7k;q'lEk(DbKp+-9"
    CMDS = sys.argv[1:]
    
    success = run_ssh_command(HOST, USER, PASS, CMDS)
    if not success:
        sys.exit(1)
