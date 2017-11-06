import time, logging, threading, os, platform, subprocess, sys, json

logging.getLogger().setLevel(0)
python_cmd = "python2"
try: 
    subprocess.call(["which", "python2"])
except: 
    python_cmd = "python3"

try:
	script_dir = os.path.dirname(os.path.realpath(__file__))
except:
	logging.critical("This script is not meant to be ran from an interpreter. (__file__ is undefined)")
	sys.exit()

os.chdir(script_dir)

with open('config.json') as config_file:    
	config = json.load(config_file)

while True:
	logging.debug("Attempting to open process. " + time.strftime("%c"))
	os.system("nohup " + python_cmd + " wxapp_serv_pull.py >/dev/null 2>&1 &")
	logging.debug("Process opened.")
	time.sleep(config["loop_time"])
