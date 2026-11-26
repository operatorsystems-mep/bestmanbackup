import sys
from fontTools.ttLib import TTFont, newTable
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
def conv(src,dst):
    f=TTFont(src); go=f.getGlyphOrder(); gs=f.getGlyphSet(); glyf={}
    for n in go:
        p=TTGlyphPen(gs); gs[n].draw(Cu2QuPen(p,1.0,reverse_direction=True)); glyf[n]=p.glyph()
    f["loca"]=newTable("loca"); f["glyf"]=g=newTable("glyf"); g.glyphOrder=go; g.glyphs=glyf
    del f["CFF "]
    if "VORG" in f: del f["VORG"]
    f["maxp"]=m=newTable("maxp"); m.tableVersion=0x00010000; m.maxZones=1
    for a in "maxTwilightPoints maxStorage maxFunctionDefs maxInstructionDefs maxStackElements maxSizeOfInstructions maxComponentElements".split(): setattr(m,a,0)
    f["head"].glyphDataFormat=0; f["post"].formatType=2.0; f["post"].extraNames=[]; f["post"].mapping={}; f["post"].glyphOrder=go
    f.sfntVersion="\x00\x01\x00\x00"; f.save(dst)
for n in ["NimbusSans-Regular","NimbusSans-Bold","NimbusSans-Italic","NimbusSans-BoldItalic","NimbusRoman-Regular","NimbusRoman-Bold","NimbusRoman-Italic","NimbusRoman-BoldItalic"]:
    conv(f"/usr/share/fonts/opentype/urw-base35/{n}.otf",f"{n}.ttf"); print(n)
