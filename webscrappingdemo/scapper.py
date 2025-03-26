# webscrappingdemo/scrapper.py

from sources.carturesti import get_carturesti_events
from sources.humanitas import get_humanitas_events

def main():
    all_events = []

    all_events.extend(get_carturesti_events())
    all_events.extend(get_humanitas_events())

    for event in all_events:
        print(f"[{event['source']}] {event['title']}\n🔗 {event['link']}\n")

if __name__=="__main__":
    main()
