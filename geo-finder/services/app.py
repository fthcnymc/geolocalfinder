from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_restful import Api, Resource
from werkzeug.utils import secure_filename
from PIL import Image
from transformers import CLIPProcessor, CLIPModel
import torch
import os
import itertools

app = Flask(__name__)
cors = CORS(app)
api = Api(app)

# Set the path where uploaded files will be stored
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Load CLIP model and processor
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
    
current_directory = os.path.dirname(os.path.abspath(__file__))
file_path = os.path.join(current_directory, 'country_list.txt')
labels = read_country_names(file_path)

class ImageClassifier(Resource):
    def post(self):
        try:
            # Check if the post request has the file part
            if 'file' not in request.files:
                return {'error': 'No file part'}, 400

            file = request.files['file']

            # If the user does not select a file, the browser submits an empty file without a filename
            if file.filename == '':
                return {'error': 'No selected file'}, 400

            img = Image.open(file)

            # Preprocess the image to obtain pixel values
            inputs = processor(text=labels, images=img, return_tensors="pt", padding=True)

            with torch.no_grad():
                outputs = model(**inputs)

            logits_per_image = outputs.logits_per_image
            prediction = logits_per_image.softmax(dim=1)
            confidences = {labels[i]: float(prediction[0][i].item()) for i in range(len(labels))}

            sorted_countries = sorted(confidences.items(), key=lambda x: x[1], reverse=True)
            top5 = dict(itertools.islice(sorted_countries, 5))
            return jsonify(top5)

        except Exception as e:
            error_message = f"An error occurred: {str(e)}"
            print(error_message)
            return jsonify({'error': error_message}), 500


api.add_resource(ImageClassifier, '/classify')

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

class FileUpload(Resource):
    def post(self):
        # Check if the post request has the file part
        if 'file' not in request.files:
            return {'error': 'No file part'}, 400

        file = request.files['file']

        # If the user does not select a file, the browser submits an empty file without a filename
        if file.filename == '':
            return {'error': 'No selected file'}, 400

        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)

            # Save the file to the server
            file.save(file_path)

            return {'message': 'File uploaded successfully', 'filename': filename}
        else:
            return {'error': 'Invalid file type'}, 400

api.add_resource(FileUpload, '/upload')

if __name__ == '__main__':
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)
    app.run(debug=True)