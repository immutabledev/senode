#!/usr/bin/env python
# -*- coding: utf-8 -*-
# PYTHON_ARGCOMPLETE_OK

import os
import time
import datetime
import threading
import zmq
from luma.core.render import canvas
from luma.oled.device import ssd1306
from luma.core.interface.serial import spi
from PIL import ImageFont

temp1 = "---" 
temp2 = "---" 
temp3 = "---"
temp = "---"
humidity = "---"

def main():
    serial = spi()
    device = ssd1306(serial)
    font_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'fonts', "ProggyTiny.ttf"))
    font = ImageFont.truetype(font_path, 16) 
    fontLarge = ImageFont.truetype(font_path, 30)
    today_last_time = "Unknown"
    while True:
        now = datetime.datetime.now()
        today_date = now.strftime("%d %b %y")
        today_time = now.strftime("%H:%M:%S")
        if today_time != today_last_time:
            today_last_time = today_time
            with canvas(device) as draw:
                now = datetime.datetime.now()
                today_date = now.strftime("%b %d, %y")

                margin = 4

                cx = 30
                cy = min(device.height, 64) / 2

                left = cx - cy
                right = cx + cy

                draw.text((margin, 0), today_date, font=font, fill="white")
                draw.text((80, 0), today_time, font=font, fill="white")

                try:
                    t1 = "{:3d}".format(int(temp1))
                except:
                    t1 = "---" 

                try:
                    t2 = "{:3d}".format(int(temp2))
                except:
                    t2 = "---" 

                try:
                    t3 = "{:3d}".format(int(temp3))
                except:
                    t3 = "---"

                try:
                    t = "{:3d}".format(int(temp))
                except:
                    t = "---"

                try:
                    h = "{:3d}".format(int(humidity))
                except:
                    h = "---"

                draw.text((margin, 14), t1+"F", font=fontLarge, fill="white")
                draw.text((margin, 32), t2+"F", font=fontLarge, fill="white")
                draw.text((margin, 50), t3+"F", font=fontLarge, fill="white")

                draw.text((52, 24), "1.2A", font=font, fill="white")

                draw.text((52, 52), "0.8A", font=font, fill="white")

                draw.text((90, 14), "S:100%", font=font, fill="white")

                draw.text((90, 24), "T:"+t+"F", font=font, fill="white")

                draw.text((90, 34), "H:"+h+"%", font=font, fill="white")

        time.sleep(0.1)

def background():
    global temp1
    global temp2
    global temp3

    ctx = zmq.Context()
    sub = ctx.socket(zmq.SUB)
    sub.connect("tcp://127.0.0.1:3000")

    sub.setsockopt(zmq.SUBSCRIBE, "temp1")
    sub.setsockopt(zmq.SUBSCRIBE, "temp2")
    sub.setsockopt(zmq.SUBSCRIBE, "temp3")

    while True:
        string = sub.recv_string()
#        print "Recv: ["+string+"]\n"
        sensor, val = string.split()

        if sensor == "temp1":
            temp1 = str(int(round(float(val))))
#            print "New Temp1: ["+temp1+"]\n"

        if sensor == "temp2":
            temp2 = str(int(round(float(val))))
#            print "New Temp2: ["+temp2+"]\n"

        if sensor == "temp3":
            temp3 = str(int(round(float(val))))
#            print "New Temp3: ["+temp3+"]\n"

def background_th():
    global temp
    global humidity 

    ctx = zmq.Context()
    sub = ctx.socket(zmq.SUB)
    sub.connect("tcp://127.0.0.1:3001")

    sub.setsockopt(zmq.SUBSCRIBE, "temp")
    sub.setsockopt(zmq.SUBSCRIBE, "humidity")

    while True:
        string = sub.recv_string()
#        print "Recv: ["+string+"]\n"
        sensor, val = string.split()

        if sensor == "temp":
            temp = str(int(round(float(val))))
#            print "New Temp: ["+temp+"]\n"

        if sensor == "humidity":
            humidity = str(int(round(float(val))))
#            print "New Humidity: ["+humidity+"]\n"

if __name__ == "__main__":
    try:
        thread1 = threading.Thread(target=background, args=())
        thread1.daemon = True
        thread1.start()

        thread2 = threading.Thread(target=background_th, args=())
        thread2.daemon = True
        thread2.start()

        main()
    except KeyboardInterrupt:
        pass
