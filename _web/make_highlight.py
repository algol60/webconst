# Make a texture for the highlighting torus.
#

from PIL import Image, ImageDraw, ImageColor

def make4():
    color1 = 255, 255, 0
    color2 = 255, 0, 0
    # color2 = 70, 130, 180

    img = Image.new('RGBA', (256, 256), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.rectangle([(0,0), (128, 128)], fill=color1)
    draw.rectangle([(128, 128), (256, 256)], fill=color1)
    draw.rectangle([(128,0), (256,128)], color2)
    draw.rectangle([(0,128), (128,256)], color2)

    return img

def make_hues():
    N = 180
    img = Image.new('RGBA', (N, N), (0, 0, 0, 1))
    draw = ImageDraw.Draw(img)

    # Draw a color wheel across the top half of the square.
    # The bottom half stays behind the billboarded torus.
    #
    for i in range(N):
        hue = i*2
        hsl = f'hsl({hue}, 100%, 50%)'
        color = ImageColor.getrgb(hsl)
        print(i, hsl, color)

        draw.rectangle([(i,0), (i+1,N//2)], fill=color)

    return img

if __name__=='__main__':
    img = make_hues()
    img.save('highlight-texture.png')
