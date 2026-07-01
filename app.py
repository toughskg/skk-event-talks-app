import os
import requests
import xml.etree.ElementTree as ET
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def parse_xml_feed(xml_content):
    try:
        root = ET.fromstring(xml_content)
    except ET.ParseError as e:
        print("XML Parse Error:", e)
        return []

    # Namespace handling
    # Atom feeds use xmlns="http://www.w3.org/2005/Atom"
    # We can handle namespaces by searching or checking root.tag
    ns = ""
    if root.tag.startswith("{"):
        ns = root.tag.split("}")[0] + "}"

    entries = []
    
    # Check if Atom or RSS
    if "feed" in root.tag.lower():
        # Atom feed
        for entry_node in root.findall(f"{ns}entry"):
            title_node = entry_node.find(f"{ns}title")
            updated_node = entry_node.find(f"{ns}updated")
            if updated_node is None:
                updated_node = entry_node.find(f"{ns}published")
            
            content_node = entry_node.find(f"{ns}content")
            if content_node is None:
                content_node = entry_node.find(f"{ns}summary")
            id_node = entry_node.find(f"{ns}id")
            link_node = entry_node.find(f"{ns}link")
            
            title = title_node.text if title_node is not None else "No Title"
            updated = updated_node.text if updated_node is not None else ""
            content = content_node.text if content_node is not None else ""
            
            link = ""
            if link_node is not None:
                link = link_node.attrib.get("href", "")
            
            entries.append({
                "title": title,
                "updated": updated,
                "content": content,
                "link": link or (id_node.text if id_node is not None else "")
            })
    else:
        # RSS feed
        channel = root.find("channel")
        items = channel.findall("item") if channel is not None else root.findall(".//item")
        for item in items:
            title_node = item.find("title")
            pub_date_node = item.find("pubDate")
            desc_node = item.find("description")
            link_node = item.find("link")
            
            title = title_node.text if title_node is not None else "No Title"
            updated = pub_date_node.text if pub_date_node is not None else ""
            content = desc_node.text if desc_node is not None else ""
            link = link_node.text if link_node is not None else ""
            
            entries.append({
                "title": title,
                "updated": updated,
                "content": content,
                "link": link
            })
            
    return entries

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/release-notes")
def get_release_notes():
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        use_fallback = False
        notes = []
        
        try:
            response = requests.get(FEED_URL, headers=headers, timeout=10)
            if response.status_code != 200 or "sorry/image" in response.text or "captcha" in response.text.lower():
                print("Google blocked the request or returned an error. Using local fallback.")
                use_fallback = True
            else:
                notes = parse_xml_feed(response.content)
                if not notes:
                    print("Parsed empty notes from feed. Using local fallback.")
                    use_fallback = True
        except Exception as e:
            print(f"Error fetching feed: {e}. Using local fallback.")
            use_fallback = True
            
        if use_fallback:
            fallback_path = os.path.join(os.path.dirname(__file__), "fallback_release_notes.xml")
            if os.path.exists(fallback_path):
                with open(fallback_path, "r", encoding="utf-8") as f:
                    xml_content = f.read()
                notes = parse_xml_feed(xml_content.encode("utf-8"))
            else:
                return jsonify({"error": "Failed to fetch feed and fallback file was not found"}), 500
                
        return jsonify({"notes": notes})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    # Standard Flask port
    app.run(debug=True, host="127.0.0.1", port=5000)
