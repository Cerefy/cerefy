import urllib.request
import json
import os
import base64

screens = [
    ("EyeX_1", "67a0301ae71148b48c9b9926786414c9"),
    ("EyeX_2", "f3135185ff70415abb6bcbbe750c1119"),
    ("EyeX_3", "fc16206da4844538800baaaa38908396"),
    ("EyeX_4", "d2ab7b2d3c784c779b1fffe29b3b8744")
]

API_KEY = os.environ.get("STITCH_API_KEY", "")
BASE_URL = "https://stitch.googleapis.com/v1/projects/11511018157416526119/screens/"

os.makedirs("stitch_screens", exist_ok=True)

for title, screen_id in screens:
    print(f"Fetching {title} ({screen_id})...")
    req = urllib.request.Request(
        BASE_URL + screen_id,
        headers={"X-Goog-Api-Key": API_KEY}
    )
    
    try:
        res = urllib.request.urlopen(req)
        data = json.loads(res.read())
        
        # Save HTML
        html_code_info = data.get("htmlCode", {})
        if isinstance(html_code_info, dict) and "downloadUrl" in html_code_info:
            html_url = html_code_info["downloadUrl"]
            html_req = urllib.request.Request(html_url)
            html_res = urllib.request.urlopen(html_req)
            html_code = html_res.read().decode('utf-8')
        elif isinstance(html_code_info, str):
            html_code = html_code_info
        else:
            html_code = str(html_code_info)
            
        with open(f"stitch_screens/{title}.html", "w", encoding="utf-8") as f:
            f.write(html_code)
        print(f"  Saved HTML: stitch_screens/{title}.html")
        
        # Save Image
        screenshot = data.get("screenshot", {})
        if isinstance(screenshot, dict) and "downloadUrl" in screenshot:
            img_url = screenshot["downloadUrl"]
            img_req = urllib.request.Request(img_url)
            img_res = urllib.request.urlopen(img_req)
            with open(f"stitch_screens/{title}.png", "wb") as f:
                f.write(img_res.read())
            print(f"  Saved Image: stitch_screens/{title}.png")
        elif isinstance(screenshot, str):
            if screenshot.startswith("http"):
                # It's a URL
                img_req = urllib.request.Request(screenshot)
                img_res = urllib.request.urlopen(img_req)
                with open(f"stitch_screens/{title}.png", "wb") as f:
                    f.write(img_res.read())
                print(f"  Saved Image: stitch_screens/{title}.png")
            elif screenshot.startswith("data:image"):
                # It's a data URI
                header, base64_str = screenshot.split(",", 1)
                img_data = base64.b64decode(base64_str)
                with open(f"stitch_screens/{title}.png", "wb") as f:
                    f.write(img_data)
                print(f"  Saved Image: stitch_screens/{title}.png")
            else:
                # Assuming raw base64
                try:
                    img_data = base64.b64decode(screenshot)
                    with open(f"stitch_screens/{title}.png", "wb") as f:
                        f.write(img_data)
                    print(f"  Saved Image: stitch_screens/{title}.png")
                except Exception as e:
                    print(f"  Could not parse screenshot string: {e}")
        elif isinstance(screenshot, dict) and "url" in screenshot:
            url = screenshot["url"]
            img_req = urllib.request.Request(url)
            img_res = urllib.request.urlopen(img_req)
            with open(f"stitch_screens/{title}.png", "wb") as f:
                f.write(img_res.read())
            print(f"  Saved Image: stitch_screens/{title}.png")
            
    except Exception as e:
        print(f"Error fetching {title}: {e}")
