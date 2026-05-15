import os

p = 'youtube_cast_addon/rootfs/app/static/js/app.js'
with open(p, 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace("fetch('/api/", "fetch('api/")
c = c.replace("fetch(`/api/", "fetch(`api/")
c = c.replace("src='/static/", "src='static/")
c = c.replace('src="/static/', 'src="static/')

with open(p, 'w', encoding='utf-8') as f:
    f.write(c)

print("Replaced!")
