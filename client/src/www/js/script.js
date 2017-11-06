var ROOT_URL = "{{DATA_URL}}";
var FORECAST_URL = ROOT_URL + "weather.json";
var RADAR_URL = ROOT_URL + "radar.png";
var BG_URL = ROOT_URL + "bg.jpg";
var BG_BLUR_URL = ROOT_URL + "bg_blur.jpg";

var APP_VERSION = "{{VERSION}}";
var APP_CODE = "{{BUILD}}";

// ----------------------------------------------------------------------------
//	HELPER METHODS
// ----------------------------------------------------------------------------

var rem = parseInt(
	window.getComputedStyle(
		document.getElementsByTagName('html')[0]
	)['fontSize']
);

function sum(a) {
    s = 0;
    for (var i in a) s += a[i];
    return s;
} 

function degToRad(a) { return Math.PI/180*a }

function meanAngleDeg(a) {
	return 180 / Math.PI*Math.atan2(
		sum(a.map(degToRad).map(Math.sin))/a.length,
		sum(a.map(degToRad).map(Math.cos))/a.length
	)
}

if(!String.prototype.trim) {  
	String.prototype.trim = function() {  
		return this.replace(/^\s+|\s+$/g,'');  
	};  
} 

if (typeof String.prototype.startsWith != 'function') {
	String.prototype.startsWith = function (str) {
		return this.slice(0, str.length) == str;
	};
}

// ----------------------------------------------------------------------------
// DRAWER
// ----------------------------------------------------------------------------

function toggleDrawer() {
	if ($("#drawer_main").hasClass("drawer_open"))
		this.closeDrawer();
	else 
		$("#drawer_main").addClass("drawer_open");
}

function closeDrawer() {
	$("#drawer_main").removeClass("drawer_open");
}

// ----------------------------------------------------------------------------
// INITIALIZE APP
// ----------------------------------------------------------------------------
if (typeof localStorage.setting_metric == "undefined")
	localStorage.setting_metric = false;

if (typeof localStorage.setting_autorefresh == "undefined")
	localStorage.setting_autorefresh = true;

function tempUnitSet(t) {
	if (window.localStorage.setting_metric  == "true")
		return Math.round((parseInt(t) - 32)*(5/9)) + "&deg;C";
	else
		return t + "&deg;F";
}

function speedSet(s) {
	return (window.localStorage.setting_metric  == "true") ? Math.round(parseInt(s)*1.609344) : s;
}

function speedUnitSet(s) {
	return (window.localStorage.setting_metric  == "true") ? "KM/H" : "MPH";
}

var lastRefresh = new Date();

function checkRefresh() {
	var currentTime = new Date();
	if ((currentTime.getTime() - window.lastRefresh.getTime()) >= 300000) {
		window.lastRefresh = currentTime;
		refresh();
	}
}

$(document).ready(function() {
	window.isApp =
		document.URL.indexOf('http://')  === -1 &&
		document.URL.indexOf('https://') === -1;
	window.mobile = (															// Detect if mobile device
		('ontouchstart' in window) ||
		window.DocumentTouch && document instanceof window.DocumentTouch
	);

	var badgeGPlay = (
		'<a href="https://play.google.com/store/apps/details?id=com.bcsdk12.bcsdwx">' +
			'<img style="height:4rem" alt="Get it on Google Play" src="./img/badge_gplay.png"/>' +
		'</a>'
	);

	if (window.isApp) {
		$.getScript("./cordova.js", function() {
			document.addEventListener("deviceready", function() {
			    if ((device.platform == "iOS") && (parseFloat(window.device.version) >= 7.0))
			    	$("body").addClass("ios7");
			    if (device.platform == "Android")
					$("#update_link").html(badgeGPlay);
		    });
		});
		$("#ad_section").hide();
	} else
		$("#ad_section").html(badgeGPlay + '<br>Android, Google Play and the Google Play logo are trademarks of Google Inc.');

	$("#version").text(APP_VERSION);
	$("#build").text(APP_CODE);

	$(".setting").each(function(i){
		$($(".setting")[i]).prop(
			"checked",
			window.localStorage[$(".setting")[i].id]  == "true"
		);
	});

	$(".setting").change(function(e){
		var id = e.currentTarget.id;
		window.localStorage[id] = $("#" + id).prop("checked");
	});

	$("#setting_metric").change(function(e){
		pages.home.reset = true;
	});

	changeTheme();
	$("#setting_darktheme").change(changeTheme);

	window.autorefreshLoop = setInterval(function() {
		if ((window.localStorage.setting_autorefresh == "true") && (window.location.hash == "#home")) checkRefresh();
	}, 2000);

	$(".drawer_toggle").click(toggleDrawer);
	$(".drawer_cont").click(closeDrawer);

	$(".pagelink").click(function(e) {
		var classArray = e.currentTarget.classList;
		for (var i=0;i<classArray.length;i++) {
			if (classArray[i].indexOf("pagelink_") != -1) {
				window.location.hash = classArray[i].substring(9);
				break;
			}
		}
	});

	if (window.location.hash.substr(1) != "")									// Reset page hash
		history.replaceState("", document.title, window.location.pathname);
	window.onhashchange = hashChange;											// Change page on hash change

	if (window.mobile) {														// If device is mobile
		$("body").addClass("mobile");
		Origami.fastclick(document.body);
		$(window).on("swiperight", function(e){
			if (e.swipestart.coords[0] < 64)
				toggleDrawer();
		});
	} else {																	// If desktop init perfectscrollbar
		$("#page_forecast .content").perfectScrollbar({suppressScrollX: true});
		$("#page_home .content").perfectScrollbar({suppressScrollX: true});
		$("#page_settings .content").perfectScrollbar({suppressScrollX: true});
	}

	$(".navbar_back").click(function() {										// Back buttons
		window.history.back();
	});
	
	$("#page_home .content").scroll(function() {								// Homepage scrolling (transparent navbar)
		if (!pages.home.reset)
			if ($("#page_home .content").scrollTop() > 4*rem)
				$("#page_home .navbar_bg").css("opacity", 1);
			else	
				$("#page_home .navbar_bg").css("opacity",
					$("#page_home .content").scrollTop() /
					Math.min($("#page_home .content")[0].scrollHeight - $("#page_home .content").height(),4*rem)
				);
	});
	
	$("#wc_stats").click(function(){											// Radar page
		window.location.hash = "radar";
	});
	
	refresh();
	$(".navbar_refresh").click(refresh);										// Refresh button (current)
	
	setTimeout(function() {														// Hide splashscreen after 1 sec
		$("#splashscreen").addClass("splashscreen_hide");
	},1000);

	$.getScript("http://maps.googleapis.com/maps/api/js", function() {
		window.map_radar = new google.maps.Map(document.getElementById("map_radar"), {
			center: new google.maps.LatLng(43.147493, -76.5),
			zoom: window.mobile ? 6 : 7,
			mapTypeId: google.maps.MapTypeId.HYBRID,
			mapTypeControl: true,
		    mapTypeControlOptions: {
		        style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
		        position: google.maps.ControlPosition.BOTTOM_CENTER
		    },
			streetViewControl: false,
		});
		
		window.map_radar_marker = new google.maps.Marker({
		    position: {
		    	lat: 44.772024,
		    	lng: -73.491604
		    },
		    map: window.map_radar,
		    title: "Beekmantown High School",
		    icon: "./img/map_marker.png"
		});

		window.map_radar_layer = new google.maps.GroundOverlay(
			RADAR_URL,
			{
				north: 50.406625,
				south: 21.652538889,
				east: -66.517938889,
				west: -127.620375
			}
		);
		window.map_radar_layer.setMap(window.map_radar);
	});
});

function changeTheme() {
	var cmd = $("#setting_darktheme").prop("checked") ? "addClass" : "removeClass";
	$("body")[cmd]("dark");
}

function hashChange() { // On hash change, change page
	var hash = window.location.hash.substr(1);
	$(".pagelink").removeClass("pagelink_open");
	$(".pagelink_" + hash).addClass("pagelink_open");
	if (hash != "")
		pages[hash].open();
}

function refresh() {
	history.replaceState("", document.title, window.location.pathname);
	pages.hideAll();
	$("#page_home .navbar_bg").css("opacity", 1);
	$("#page_home").addClass("page_open");
	
	$("#page_home .content").addClass("content_hide");
	$("#page_home .loader").show();
	
	pages.home.reset = true;
	$.ajax({
		type: "GET",
		url: FORECAST_URL,
		cache: false,
		dataType: "json",
		success: function(file) {
			window.weather = file;
			if (parseFloat(APP_VERSION) < parseFloat(window.weather.version.min))
				history.replaceState("", document.title, "#update");
			else
				history.replaceState("", document.title, "#home");
			hashChange();
		},
		error: function() { pages.error.open() }
	});
}

function createForecastCards() {
	var html = "";
	var forecastOrdered = [];
	var forecastOrderedNames = [];
	
	for (var i=0;i<Object.keys(weather.forecast).length;i++)
		for (var x in weather.forecast)
			if (weather.forecast[x].index == i) {
				forecastOrdered.push(weather.forecast[x])
				forecastOrderedNames.push(x);
			}
	
	for (var i=0;i<forecastOrdered.length;i++) {
		html +=	'\
<div class="wc_card" id="' + forecastOrderedNames[i].replace(" ", "_") + '"><div>\
<div class="wc_card_title"><span>' + forecastOrderedNames[i] + '</span></div>\
<div class="wc_card_icon icon-' + forecastOrdered[i].icon + '"></div>\
<div class="wc_card_subtitle"><span>' + forecastOrdered[i].condition + '</span></div>\
</div>\
<div class="wc_card_stats">';
				
		if (!isNaN(forecastOrdered[i].high)) html += '\
<div>\
<div class="stat_desc"><div class="stat_icon icon-arrow-up-bold"></div><div class="stat_cell">HIGH</div></div>\
<div>' + tempUnitSet(forecastOrdered[i].high) + '</div>\
</div>';
					
		if (!isNaN(forecastOrdered[i].low)) html += '\
<div>\
<div class="stat_desc"><div class="stat_icon icon-arrow-down-bold"></div><div class="stat_cell">LOW</div></div>\
<div>' + tempUnitSet(forecastOrdered[i].low) + '</div>\
</div>';
					
		html +=	'\
<div>\
<div class="stat_desc"><div class="stat_icon icon-rainy"></div><div class="stat_cell">RAIN</div></div>\
<div>' + forecastOrdered[i].rain + '%</div>\
</div>\
</div>\
</div>';
	}
	$("#wc_card_cont_for").html(html);
	$("#wc_card_cont_for .wc_card").click(function(e){
		pages.forecast.obj = weather.forecast[e.target.id.replace("_", " ")];
		window.location.hash = "forecast";
	});

	for (var i=0;i<forecastOrdered.length;i++) {
		var baseElement = "#" + forecastOrderedNames[i].replace(" ", "_");
		if ($(baseElement + " .wc_card_subtitle > span").height() > rem)
			$(baseElement + " .wc_card_icon").removeClass().addClass("wc_card_icon");
	}
}

var pages = {
	list: ["home", "error", "forecast", "radar", "settings", "photo"],
	hideAll: function() {
		for (var i=0;i<this.list.length;i++)
			this[this.list[i]].hide()
	},
	home: {
		setBg: function(url) {
			$('#wc_bg').css('background-image', 'url("' + url + '")');
			setTimeout(function() {
				$('#wc_bg').css('visibility', 'visible');
				setTimeout(function() {
					$('#wc_bg').css('opacity', '1');
				});
			}, 500);
		},
		reset: true,
		set: function() {
			var angles = [];
			if (weather.current.winddir) {
				for (var i = 0; i < weather.current.winddir.length; i++) {
					var l = weather.current.winddir[i].toLowerCase();
					if (l == "w") angles.push(270);
					else if (l == "s") angles.push(180);
					else if (l == "e") angles.push(90);
					else if (l == "n") angles.push(0);
				}
			}
			$("#wc_wind_circle").css({
				transform: "rotate(" + meanAngleDeg(angles) + "deg)",
				"-webkit-transform": "rotate(" + meanAngleDeg(angles) + "deg)"
			});
			
			$("#wc_temp").html(tempUnitSet(weather.current.temp));
			$("#t_high").html(tempUnitSet(weather.current.high));
			$("#t_low").html(tempUnitSet(weather.current.low));
			$("#t_hum").text(weather.current.humidity + "%");
			$("#t_wind").text(speedSet(weather.current.windspeed));
			$("#wc_wind_unit").text(speedUnitSet())

			
			$("#wc_cond_text").text(weather.current.condition);
			createForecastCards();

			$("#wc_timestamp").text("Last updated at " + weather.current.timestamp);
			
			if (!window.mobile)
				$("#page_home .content").perfectScrollbar("update");
			
			$("#page_home .content").scrollTop(0);
			$("#page_home .navbar_bg").css("opacity", 0);
			setTimeout(function() {
				$("#page_home .loader").hide();
			}, 250);
			
			pages.home.reset = false;
			pages.home.open();
			
			// ----------------------------------------------------------

			$(".navbar_photo").hide();
			$('#wc_bg').css({
				'background-image': 'none',
				'opacity': '0',
				'visibility': 'hidden'
			});

			window.bg_url = BG_BLUR_URL + "?_=" + ((new Date).getTime());

			$.ajax({
				url: window.bg_url,
				success: function() {
					pages.home.setBg(window.bg_url);
					$(".navbar_photo > a").attr("href", BG_URL);
					$(".navbar_photo").show();
				},

				error: function() {
					window.bg_url = './img/' + (window.weather.night ? 'bg_night' : 'bg') + '/' + weather.current.bg + '.jpg';

					$.ajax({
						url: window.bg_url,
						success: function() {
							pages.home.setBg(window.bg_url);
						}
					});
				}
			});
		},
		open: function() {
			checkRefresh();
			pages.hideAll();
			$("#page_home").addClass("page_open");

			if (this.reset) this.set();
			else $("#page_home .content").removeClass("content_hide");
		},
		hide: function() {
			$("#page_home").removeClass("page_open");
		}
	},
	error: {
		open: function() {
			$("#page_error").addClass("page_open");
		},
		hide: function(){
			$("#page_error").removeClass("page_open");
		}
	},
	update: {
		open: function() {
			$("#page_update").addClass("page_open");
		},
		hide: function(){
			$("#page_update").removeClass("page_open");
		}
	},
	radar: {
		open: function() {
			$("#page_radar").addClass("page_open");
		},
		hide: function() {
			$("#page_radar").removeClass("page_open");
		}
	},
	photo: {
		open: function() {
			$("#page_photo").addClass("page_open");
		},
		hide: function() {
			$("#page_photo").removeClass("page_open");
		}
	},
	settings: {
		open: function() {
			pages.hideAll();
			$("#page_settings").addClass("page_open");

			if (!window.mobile)
				$("#page_settings .content").perfectScrollbar("update");
		},
		hide: function() {
			$("#page_settings").removeClass("page_open");
		}
	},
	forecast: {
		obj: undefined,
		open: function() {
			if (this.obj) {
				$("#page_forecast .content").scrollTop(0);
				
				var obj = this.obj;
				$("#page_forecast .navbar_text").text(this.obj.name);
				
				$("#for_day .for_icon")	.removeClass()
										.addClass("for_icon " + this.obj.icon);

				$("#for_day .for_icon")	.removeClass()
										.addClass("for_icon icon-" + this.obj.icon);
											
				$("#for_day .for_desc_header").text(this.obj.condition);
				$("#for_day .for_desc_full").text(this.obj.description);
				
				if (isNaN(this.obj.high))
					$("#for_day .for_card_high").hide();
				else {
					$("#for_day .for_high").html(tempUnitSet(this.obj.high));
					$("#for_day .for_card_high").show();
				}

				if (isNaN(this.obj.low))
					$("#for_day .for_card_low").hide();
				else {
					$("#for_day .for_low").html(tempUnitSet(this.obj.low));
					$("#for_day .for_card_low").show();
				}
											
				$("#for_day .for_rain").text(this.obj.rain + "%");

				if (this.obj.night) {
					$("#for_day .for_time")			.show();
					$("#for_night")					.show();
					$("#for_night .for_desc_header").text(this.obj.night.condition);
					$("#for_night .for_desc_full")	.text(this.obj.night.description);
					$("#for_night .for_rain")		.text(this.obj.night.rain + "%");

					$("#for_night .for_icon")	.removeClass()
												.addClass("for_icon icon-" + this.obj.night.icon);
				} else {
					$("#for_night").hide();
					$("#for_day .for_time").hide();
				}

				$("#page_forecast").addClass("page_open");
				
				if (!window.mobile)
					$("#page_forecast .content").perfectScrollbar("update");
			} else window.history.back();
		},
		hide: function() {
			$("#page_forecast").removeClass("page_open");
		}
	}
};