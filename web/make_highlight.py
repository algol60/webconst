# Make a texture for the highlighting torus.
#

from PIL import Image, ImageDraw

color1 = 255, 255, 0
color2 = 255, 0, 0
# color2 = 70, 130, 180

img = Image.new('RGBA', (256, 256), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)
draw.rectangle([(0,0), (128, 128)], fill=color1)
draw.rectangle([(128, 128), (256, 256)], fill=color1)
draw.rectangle([(128,0), (256,128)], color2)
draw.rectangle([(0,128), (128,256)], color2)

img.save('highlight-texture.png')
