import os, time
from playwright.sync_api import sync_playwright
HERE=os.path.dirname(os.path.abspath(__file__))
FONTS='<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Archivo:wght@400;500;600&family=IBM+Plex+Mono&display=swap">'
CSS='<style>html,body{margin:0;width:1920px;height:1080px;background:#f6f4ee;color:#1c1b17;font-family:Archivo,sans-serif}.c{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;padding:0 180px}.serif{font-family:"Instrument Serif",serif}.mono{font-family:"IBM Plex Mono",monospace}</style>'
def page(body,bg=None):
    return '<!doctype html><html><head>'+FONTS+CSS+(('<style>html,body{background:'+bg+'}</style>') if bg else '')+'</head><body>'+body+'</body></html>'
CARDS={
 'title': page('<div class="c" style="justify-content:flex-start;padding-top:64px"><div class="mono" style="font-size:26px;letter-spacing:.14em;color:#fff;text-shadow:0 1px 8px #000">FREEFALL: A RECKONING FOR BOEING · NETFLIX, 2026</div></div>','transparent'),
 'a': page('<div class="c" style="align-items:center"><div class="serif" style="font-size:720px;line-height:1;color:#b8431f;font-weight:700">A</div></div>','#1c1b17'),
 'raw': page('<div class="c"><div class="mono" style="font-size:12px;letter-spacing:.14em;color:#6f6a62;margin-bottom:28px">THE MECHANIC’S WORDS, AS FILED · RECORD ASAA2024010547162</div><div class="mono" style="font-size:44px;line-height:1.5;max-width:1560px;border-left:3px solid #d8d2c6;padding-left:36px">AT APPROXIMATELY 16,000 FT DURING CLIMB OUT OF PDX THE AIRCRAFT EXPERIENCED A RAPID DECOMPRESSION. IT WAS DISCOVERED THAT THE L/H MID EXIT DOOR PLUG STRUCTURE BLEW OUT AND DEPARTED THE AIRCRAFT. GROUNDED - YES.</div><div class="mono" style="font-size:26px;color:#6f6a62;margin-top:40px">ZONE 800 · HOW FOUND: O · STAGE: CL · CREW: B, A · FILED BY: A</div></div>'),
 'end': page('<div class="c" style="align-items:center;text-align:center"><div class="serif" style="font-size:150px;line-height:1.05">aircraftdefects<span style="color:#b8431f">.com</span></div><div style="font-size:34px;color:#6f6a62;margin-top:36px">Built with <span style="color:#245c5a;font-weight:600">GLM-5.3-Flash</span> · GLM-5.3 Flash Lightning Hackathon</div><div class="mono" style="font-size:24px;color:#6f6a62;margin-top:26px;letter-spacing:.1em">HENK VAN ESS · 2026</div></div>'),
 'counter': page('<div class="c" style="align-items:center;text-align:center"><div id="n" class="serif" style="font-size:300px;line-height:1;font-variant-numeric:tabular-nums">0</div><div class="mono" style="font-size:30px;color:#6f6a62;margin-top:30px;letter-spacing:.14em">REPORTS · SINCE 1995 · 54,634 AIRCRAFT</div></div><script>var T=1757827,t0=null;function f(ts){if(!t0)t0=ts;var p=Math.min(1,(ts-t0)/2400);var e=1-Math.pow(1-p,3);document.getElementById("n").textContent=Math.round(T*e).toLocaleString("en-US");if(p<1)requestAnimationFrame(f)}setTimeout(function(){requestAnimationFrame(f)},600);</script>'),
}
with sync_playwright() as p:
    br=p.chromium.launch()
    import sys
    for k,html in CARDS.items():
        if sys.argv[1:] and k not in sys.argv[1:]: continue
        path=os.path.join(HERE,k+'.html'); open(path,'w').write(html)
        if k=='counter':
            ctx=br.new_context(viewport={'width':1920,'height':1080},record_video_dir=HERE,record_video_size={'width':1920,'height':1080}); pg=ctx.new_page()
            pg.goto('file://'+path); pg.wait_for_timeout(800+2400+2200); v=pg.video.path(); ctx.close(); os.replace(v,os.path.join(HERE,'counter.webm'))
        else:
            pg=br.new_page(viewport={'width':1920,'height':1080},device_scale_factor=4/3); pg.goto('file://'+path); pg.wait_for_timeout(1200)
            pg.screenshot(path=os.path.join(HERE,k+'.png'),omit_background=(k=='title')); pg.close()
        print(k,'ok')
    br.close()
