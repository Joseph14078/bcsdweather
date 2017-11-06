WVIEW_URL = "http://earthscience.bcsdk12.org/weather/wview.xml"
NWS_URL = "http://forecast.weather.gov/MapClick.php?lat=44.6955&lon=-73.4568&unit=0&lg=english&FcstType=dwml"
RADAR_URL = "http://radar.weather.gov/ridge/Conus/RadarImg/latest_radaronly.gif"

SERVER_VERSION_MAIN="1.3"
SERVER_VERSION_MIN="1.1"
SERVER_VERSION_CODE="11052017_01"

import json, math, urllib2, time, socket, os, logging, io, sys, shutil
import xml.etree.ElementTree as ET
from PIL import Image
from PIL import ImageFilter

try:
	script_dir = os.path.dirname(os.path.realpath(__file__))
except:
	logging.critical("This script is not meant to be ran from an interpreter. (__file__ is undefined)")
	sys.exit()

os.chdir(script_dir)

with open('config.json') as config_file:    
	config = json.load(config_file)

os.chdir(config["dir_output"])

logging.getLogger().setLevel(0)

socket.setdefaulttimeout(20)

array_conditions = [
	['Fair', 'Clear', 'Fair with Haze', 'Clear with Haze', 'Fair and Breezy', 'Clear and Breezy', 'Mostly Sunny', "Sunny", "Mostly Clear"],
	['Cloudy', 'Increasing Clouds', 'Mostly Cloudy', 'Mostly Cloudy with Haze', 'Mostly Cloudy and Breezy', 'Overcast', 'Overcast with Haze', 'Overcast and Breezy', 'Funnel Cloud', 'Funnel Cloud in Vicinity', 'Tornado/Water Spout'],
	['Fog/Mist', 'Fog', 'Freezing Fog', 'Shallow Fog', 'Partial Fog', 'Patches of Fog', 'Fog in Vicinity', 'Freezing Fog in Vicinity', 'Shallow Fog in Vicinity', 'Partial Fog in Vicinity', 'Patches of Fog in Vicinity', 'Showers in Vicinity Fog', 'Light Freezing Fog', 'Heavy Freezing Fog', 'Smoke', 'Dust', 'Low Drifting Dust', 'Blowing Dust', 'Sand', 'Blowing Sand', 'Low Drifting Sand', 'Dust/Sand Whirls', 'Dust/Sand Whirls in Vicinity', 'Dust Storm', 'Heavy Dust Storm', 'Dust Storm in Vicinity', 'Sand Storm', 'Heavy Sand Storm', 'Sand Storm in Vicinity', 'Haze'],
	['Freezing Rain', 'Freezing Drizzle', 'Light Freezing Rain', 'Light Freezing Drizzle', 'Heavy Freezing Rain', 'Heavy Freezing Drizzle', 'Freezing Rain in Vicinity', 'Freezing Drizzle in Vicinity', 'Ice Pellets', 'Light Ice Pellets', 'Heavy Ice Pellets', 'Ice Pellets in Vicinity', 'Showers Ice Pellets', 'Thunderstorm Ice Pellets', 'Ice Crystals', 'Hail', 'Small Hail/Snow Pellets', 'Light Small Hail/Snow Pellets', 'Heavy small Hail/Snow Pellets', 'Showers Hail', 'Hail Showers', 'Freezing Rain Snow', 'Light Freezing Rain Snow', 'Heavy Freezing Rain Snow', 'Freezing Drizzle Snow', 'Light Freezing Drizzle Snow', 'Heavy Freezing Drizzle Snow', 'Snow Freezing Rain', 'Light Snow Freezing Rain', 'Heavy Snow Freezing Rain', 'Snow Freezing Drizzle', 'Light Snow Freezing Drizzle', 'Heavy Snow Freezing Drizzle', 'Rain Ice Pellets', 'Light Rain Ice Pellets', 'Heavy Rain Ice Pellets', 'Drizzle Ice Pellets', 'Light Drizzle Ice Pellets', 'Heavy Drizzle Ice Pellets', 'Ice Pellets Rain', 'Light Ice Pellets Rain', 'Heavy Ice Pellets Rain', 'Ice Pellets Drizzle', 'Light Ice Pellets Drizzle', 'Heavy Ice Pellets Drizzle', 'Rain Snow', 'Light Rain Snow', 'Heavy Rain Snow', 'Snow Rain', 'Light Snow Rain', 'Heavy Snow Rain', 'Drizzle Snow', 'Light Drizzle Snow', 'Heavy Drizzle Snow', 'Snow Drizzle', 'Light Snow Drizzle', 'Heavy Drizzle Snow', 'Snow', 'Heavy Snow', 'Heavy Snow Showers', 'Showers Snow', 'Heavy Showers Snow', 'Snow Fog/Mist', 'Heavy Snow Fog/Mist', 'Heavy Snow Showers Fog/Mist', 'Heavy Showers Snow Fog/Mist', 'Snow Fog', 'Light Snow Fog', 'Heavy Snow Fog', 'Heavy Snow Showers Fog', 'Heavy Showers Snow Fog', 'Showers in Vicinity Snow', 'Snow Low Drifting Snow', 'Snow Blowing Snow', 'Blowing Snow', 'Heavy Snow Low Drifting Snow', 'Heavy Snow Blowing Snow', 'Snow Grains', 'Light Snow Grains', 'Heavy Snow Grains', 'Heavy Blowing Snow', 'Blowing Snow in Vicinity', 'Freezing Rain Rain', 'Light Freezing Rain Rain', 'Heavy Freezing Rain Rain', 'Rain Freezing Rain', 'Light Rain Freezing Rain', 'Heavy Rain Freezing Rain', 'Freezing Drizzle Rain', 'Light Freezing Drizzle Rain', 'Heavy Freezing Drizzle Rain', 'Rain Freezing Drizzle', 'Light Rain Freezing Drizzle', 'Heavy Rain Freezing Drizzle'],
	['Light Snow', 'Snow Showers', 'Light Snow Showers', 'Light Showers Snow', 'Light Snow Fog/Mist', 'Snow Showers Fog/Mist', 'Light Snow Showers Fog/Mist', 'Showers Snow Fog/Mist', 'Light Showers Snow Fog/Mist', 'Snow Showers Fog', 'Light Snow Showers Fog', 'Showers Snow Fog', 'Light Showers Snow Fog', 'Snow Showers in Vicinity', 'Snow Showers in Vicinity Fog/Mist', 'Snow Showers in Vicinity Fog', 'Low Drifting Snow', 'Light Snow Blowing Snow', 'Light Snow Blowing Snow Fog/Mist', 'Light Snow Low Drifting Snow'],
	['Decreasing Clouds', 'A Few Clouds', 'A Few Clouds with Haze', 'A Few Clouds and Breezy', 'Partly Sunny', 'Partly Cloudy', 'Partly Cloudy with Haze', 'Partly Cloudy and Breezy', 'Windy', 'Breezy', 'Fair and Windy', 'A Few Clouds and Windy', 'Partly Cloudy and Windy', 'Mostly Cloudy and Windy', 'Overcast and Windy'],
	['Showers', 'Rain Likely', 'Isolated Showers', 'Rain Showers', 'Light Rain Showers', 'Light Rain and Breezy', 'Heavy Rain Showers', 'Rain Showers in Vicinity', 'Light Showers Rain', 'Heavy Showers Rain', 'Showers Rain', 'Showers Rain in Vicinity', 'Rain Showers Fog/Mist', 'Light Rain Showers Fog/Mist', 'Heavy Rain Showers Fog/Mist', 'Rain Showers in Vicinity Fog/Mist', 'Light Showers Rain Fog/Mist', 'Heavy Showers Rain Fog/Mist', 'Showers Rain Fog/Mist', 'Showers Rain in Vicinity Fog/Mist', 'Showers', 'Showers in Vicinity', 'Showers in Vicinity Fog/Mist', 'Showers in Vicinity Fog', 'Showers in Vicinity Haze', 'Light Rain', 'Drizzle', 'Light Drizzle', 'Heavy Drizzle', 'Light Rain Fog/Mist', 'Drizzle Fog/Mist', 'Light Drizzle Fog/Mist', 'Heavy Drizzle Fog/Mist', 'Light Rain Fog', 'Drizzle Fog', 'Light Drizzle Fog', 'Heavy Drizzle Fog', 'Rain', 'Heavy Rain', 'Rain Fog/Mist', 'Heavy Rain Fog/Mist', 'Rain Fog', 'Heavy Rain Fog', 'Showers Likely', 'Scattered Showers'],
	['T-storms', 'Thunderstorm', 'Thunderstorm Rain', 'Light Thunderstorm Rain', 'Heavy Thunderstorm Rain', 'Thunderstorm Rain Fog/Mist', 'Light Thunderstorm Rain Fog/Mist', 'Heavy Thunderstorm Rain Fog and Windy', 'Heavy Thunderstorm Rain Fog/Mist', 'Thunderstorm Showers in Vicinity', 'Light Thunderstorm Rain Haze', 'Heavy Thunderstorm Rain Haze', 'Thunderstorm Fog', 'Light Thunderstorm Rain Fog', 'Heavy Thunderstorm Rain Fog', 'Thunderstorm Light Rain', 'Thunderstorm Heavy Rain', 'Thunderstorm Rain Fog/Mist', 'Thunderstorm Light Rain Fog/Mist', 'Thunderstorm Heavy Rain Fog/Mist', 'Thunderstorm in Vicinity Fog/Mist', 'Thunderstorm Showers in Vicinity', 'Thunderstorm in Vicinity Haze', 'Thunderstorm Haze in Vicinity', 'Thunderstorm Light Rain Haze', 'Thunderstorm Heavy Rain Haze', 'Thunderstorm Fog', 'Thunderstorm Light Rain Fog', 'Thunderstorm Heavy Rain Fog', 'Thunderstorm Hail', 'Light Thunderstorm Rain Hail', 'Heavy Thunderstorm Rain Hail', 'Thunderstorm Rain Hail Fog/Mist', 'Light Thunderstorm Rain Hail Fog/Mist', 'Heavy Thunderstorm Rain Hail Fog/Hail', 'Thunderstorm Showers in Vicinity Hail', 'Light Thunderstorm Rain Hail Haze', 'Heavy Thunderstorm Rain Hail Haze', 'Thunderstorm Hail Fog', 'Light Thunderstorm Rain Hail Fog', 'Heavy Thunderstorm Rain Hail Fog', 'Thunderstorm Light Rain Hail', 'Thunderstorm Heavy Rain Hail', 'Thunderstorm Rain Hail Fog/Mist', 'Thunderstorm Light Rain Hail Fog/Mist', 'Thunderstorm Heavy Rain Hail Fog/Mist', 'Thunderstorm in Vicinity Hail', 'Thunderstorm in Vicinity Hail Haze', 'Thunderstorm Haze in Vicinity Hail', 'Thunderstorm Light Rain Hail Haze', 'Thunderstorm Heavy Rain Hail Haze', 'Thunderstorm Hail Fog', 'Thunderstorm Light Rain Hail Fog', 'Thunderstorm Heavy Rain Hail Fog', 'Thunderstorm Small Hail/Snow Pellets', 'Thunderstorm Rain Small Hail/Snow Pellets', 'Light Thunderstorm Rain Small Hail/Snow Pellets', 'Heavy Thunderstorm Rain Small Hail/Snow Pellets', 'Thunderstorm in Vicinity', 'Thunderstorm in Vicinity Fog', 'Thunderstorm in Vicinity Haze', 'Thunderstorm Snow', 'Light Thunderstorm Snow', 'Heavy Thunderstorm Snow']
]

array_bg = [
	'clear',
	'cloudy',
	'fog',
	'heavysnow',
	'lightsnow',
	'partly',
	'rain',
	'thunderstorm'
]

array_icon = [
	"sunny",
	"cloudy",
	"fog",
	"hail",
	"snowy",
	"partlycloudy",
	"rainy",
	"lightning"
]

array_icon_night = [
	"night",
	"cloudy",
	"fog",
	"hail",
	"snowy",
	"partlycloudy-night",
	"rainy",
	"lightning"
]

weather = {
	"current": {},
	"version": {
		"main": SERVER_VERSION_MAIN,
		"code": SERVER_VERSION_CODE,
		"min": SERVER_VERSION_MIN
	}
}

def parse_current(xml):
	weather["current"]["temp"] = int(round(float(
		xml.findtext(".//data[@realtime='temp']")
	)))
	
	weather["current"]["high"] = int(round(float(
		xml.findtext(".//data[@realtime='high_temp']")
	)))
	
	weather["current"]["low"] = int(round(float(
		xml.findtext(".//data[@realtime='low_temp']")
	)))
	
	weather["current"]["humidity"] = int(
		xml.findtext(".//data[@realtime='hum']")
	)
	
	weather["current"]["windspeed"] = int(round(float(
		xml.findtext(".//data[@realtime='windspeed']")
	)))
	
	weather["current"]["winddir"] = xml.findtext(".//data[@realtime='winddir']")
	
	weather["current"]["timestamp"] = timestamp()
	
def parse_nws(xml):
	weather["night"] = (
		len(xml.findall("data")[0].findall(".//temperature")[1].findall("value")) >=
		len(xml.findall("data")[0].findall(".//temperature")[0].findall("value"))
	)
	
	forecast = {}
	key_list = xml.findall(".//time-layout")[1].findall("start-valid-time")
	index = 0
	
	for	i in range(len(key_list)):
		# CONDITION
		condition = xml.findall(".//weather-conditions")[i].attrib["weather-summary"]
		if (condition == ""): continue
		
		# KEY
		key = key_list[i].attrib["period-name"]
		key_night = "night" in key.lower()
		key_secondary = (" Night" in key) or ((key == "Tonight") and i != 0)
		
		# RAIN
		rain = int(xml.find(".//probability-of-precipitation").findall("value")[i].text or 0)
		
		# ICON
		condition_icon = condition
		if (" then " in condition_icon):
			condition_icon = condition_icon[
				:condition_icon.index(" then ")
			]
		if ("/" in condition_icon):
			condition_icon = condition_icon[
				:condition_icon.index("/")
			]
		if ("Chance " in condition_icon):
			condition_icon = condition_icon[
				(condition_icon.index("Chance ") + 7):
			]

		icon = ''
		for j in range(len(array_conditions)):
			if (condition_icon in array_conditions[j]):
				icon = array_icon_night[j] if key_night else array_icon[j]
		if icon == '':
			print "WARNING: Unknown condition '" + condition_icon + "'."
		
		# DESCRIPTION
		description = xml.find(".//wordedForecast").findall("text")[i].text
		
		if key_secondary:
			key = key_prev
			if (forecast[key]):
				forecast[key]["night"] = {
					"rain": rain,
					"condition": condition,
					"description": description,
					"icon": icon
				}
		else:
			i_high = int(math.floor((i*0.5) - (0.5 * weather["night"])))
			i_low = int(math.floor((i*0.5) + (0.5 * weather["night"])))
			if (i_high != -1):
				try: high = int(xml.findall("data")[0].findall(".//temperature")[int(weather["night"])].findall("value")[i_high].text)
				except: high = None
			else:
				high = None
				
			try: low = int(xml.findall("data")[0].findall(".//temperature")[int(not weather["night"])].findall("value")[i_low].text)
			except: low = None
			
			forecast[key] = {
				"name": key,
				"rain": rain,
				"condition": condition,
				"description": description,
				"icon": icon,
				"today": i == 0,
				"index": index
			}
			
			if high != None: forecast[key]["high"] = high
			if low != None: forecast[key]["low"] = low
			
			index += 1
			
		key_prev = key
		
	forecast["timestamp"] = timestamp()
	weather["forecast"] = forecast
	
	weather["current"]["condition"] = xml.findall("data")[1].findall(".//weather-conditions")[0].attrib["weather-summary"].strip()
	for i in range(len(array_conditions)):
		if weather["current"]["condition"] in array_conditions[i]:
			weather["current"]["bg"] = array_bg[i]
			

def timestamp():
	return time.strftime("%I:%M %p %m/%d/%y")
			
def kill_process():
	os.system("kill -9 " + str(os.getpid()))

# -----------------------------------------------------------------------------

def get_nws():
	nws_pipe = urllib2.urlopen(NWS_URL)
	try:
		nws_data = nws_pipe.read()
		nws_pipe.close()
	except:
		logging.warning("NWS request failed. Skipping for this cycle.")
	else:
		parse_nws(ET.fromstring(nws_data))
		logging.info("NWS data downloaded.")

# -----------------------------------------------------------------------------

def get_current():
	wview_pipe = urllib2.urlopen(WVIEW_URL)
	try:
		wview_data = wview_pipe.read()
		wview_pipe.close()
	except:
		logging.warning("WView request failed. Skipping for this cycle.")
	else:
		parse_current(ET.fromstring(wview_data))
		logging.info("WView data downloaded.")

# -----------------------------------------------------------------------------

def output_weather():
	global weather
	try:
		output_file = open("weather.json", "w")
		output_file.write(json.dumps(weather))
		output_file.close()
		logging.info("JSON saved.")
	except:
		logging.critical("Could not save JSON. Most likely a permissions issue.")
		kill_process()

# -----------------------------------------------------------------------------

def output_radar():
	radar_req = urllib2.Request(
		RADAR_URL,
		None,
		{ 'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:32.0) Gecko/20100101 Firefox/32.0' }
	)
	radar_pipe = urllib2.urlopen(radar_req)
	try:
		radar_data = radar_pipe.read()
		radar_pipe.close()
	except:
		logging.warning("Could not fetch radar graphic. Skipping for this cycle.")
	else:
		try:
			radar_file = Image.open(io.BytesIO(radar_data))
			radar_img = radar_file.load()
			radar_size = radar_file.size

			for x in xrange(radar_size[0]):
				for y in xrange(radar_size[1]):
					if (radar_img[x,y] < 8) & (radar_img[x,y] != 0):
						radar_img[x,y] = 0

			radar_file.save('radar.png', "PNG")
		except:
			logging.critical("Could not save radar PNG. Most likely a permissions issue.")
			kill_process()
	logging.info("Radar PNG saved.")

# -----------------------------------------------------------------------------

def output_bg():
	try: os.remove("bg.jpg")
	except: pass

	try: os.remove("bg_blur.jpg")
	except: pass

	bg_path = config["bg_path"]
	
	if not os.path.exists(bg_path):
		return logging.warning("Camera does not exist. Not creating background images.")

	bg_age = time.time() - os.path.getmtime(bg_path)

	if (bg_age < config["bg_expire"]):
		bg_img = Image.open(bg_path)
		bg_img.save("./bg.jpg", quality=90, optimize=True)
		bg_img.filter(ImageFilter.GaussianBlur(radius=15)).save("./bg_blur.jpg", quality=90, optimize=True)
		logging.info("BG images saved.")
	else:
		logging.warning("Camera image too old. Not creating background images.")

# -----------------------------------------------------------------------------


def main():
	logging.info("Pull server starting at " + timestamp())

	get_nws()
	# get_current()
	output_weather()
	output_radar()
	output_bg()

	logging.info("Pull server closed gracefully.")
	kill_process()

if __name__ == "__main__":
	main()