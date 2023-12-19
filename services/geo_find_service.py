import torch

from PIL import Image
from transformers import CLIPProcessor, CLIPModel

model = CLIPModel.from_pretrained("geolocal/StreetCLIP")

processor = CLIPProcessor.from_pretrained("geolocal/StreetCLIP")

def read_country_names(file_path):
    try:
        with open(file_path, 'r') as file:
            country_names = file.read().strip()
            country_list = eval(country_names)
        return country_list
    except FileNotFoundError:
        print(f"File not found: {file_path}")
        return None
    except Exception as e:
        print(f"An error occurred: {e}")
        return None
    
labels = read_country_names("country_list.txt")

def classify(image):
    inputs = processor(text=labels, images=image, return_tensors="pt", padding=True)
    with torch.no_grad():
        outputs = model(**inputs)
    logits_per_image = outputs.logits_per_image
    prediction = logits_per_image.softmax(dim=1)
    #Compute classification score for each country
    confidences = {labels[i]: float(prediction[0][i].item()) for i in range(len(labels))}
    return confidences

#Input image
image_path = 'C:\\Users\\Fethi\\Desktop\\repos\\geolocalfinder\\services\\italy.jpg'
img = Image.open(image_path)

#Compute classification score
scores = classify(img)
#Sort the result and take the top 10
sorted_countries = sorted(scores.items(), key=lambda x:x[1], reverse=True)
sorted_scores = dict(sorted_countries)

import itertools
top10 = dict(itertools.islice(sorted_scores.items(), 10))

#print the result
print(top10)