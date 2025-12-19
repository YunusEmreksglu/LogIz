
import os

def fix_env():
    # Read .env to find the key
    service_key = None
    if os.path.exists('.env'):
        with open('.env', 'r') as f:
            for line in f:
                if 'SUPABASE_SERVICE_ROLE_KEY' in line:
                    service_key = line.strip()
                    break
    
    if not service_key:
        print("Could not find SUPABASE_SERVICE_ROLE_KEY in .env")
        return

    # Check if already in .env.local
    already_exists = False
    if os.path.exists('.env.local'):
        with open('.env.local', 'r') as f:
            if 'SUPABASE_SERVICE_ROLE_KEY' in f.read():
                already_exists = True
    
    # Append to .env.local
    if not already_exists:
        with open('.env.local', 'a') as f:
            f.write('\n' + service_key + '\n')
            print("Appended SUPABASE_SERVICE_ROLE_KEY to .env.local")
    else:
        print("Key already exists in .env.local")

if __name__ == '__main__':
    fix_env()
