import React, { useState } from 'react';
import './App.css';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [classificationResult, setClassificationResult] = useState(null);
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (selectedFile) {
      const formData = new FormData();
      formData.append('file', selectedFile);

      try {
        // Upload the file
        const uploadResponse = await fetch('http://localhost:5000/upload', {
          method: 'POST',
          body: formData,
        });

        const uploadData = await uploadResponse.json();
        console.log(uploadData); // Handle the upload response as needed

        // Analyze the uploaded image
        const classifyResponse = await fetch('http://localhost:5000/classify', {
          method: 'POST',
          body: formData,
        });

        const classifyData = await classifyResponse.json();
        setClassificationResult(classifyData); // Set the classification result in state
        console.log(classifyData); // Handle the classification response as needed
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome GeoFinder</h1>
      </header>
      <main>
        <input
          type="file"
          accept=".jpg, .jpeg, .png"
          onChange={handleFileChange}
        />
        {selectedFile && (
          <div>
            <p>Selected File: {selectedFile.name}</p>
            <img
              src={URL.createObjectURL(selectedFile)}
              alt="Selected Preview"
              style={{ maxWidth: '100%', maxHeight: '300px' }}
            />
            <button onClick={handleUpload}>Upload</button>
          </div>
        )}
        {classificationResult && (
          <div>
            <h2>Classification Result:</h2>
            <ul>
            {Object.entries(classificationResult)
        .sort(([, score1], [, score2]) => score2 - score1) // Sort by score in descending order
        .map(([country, score]) => (
          <li key={country}>{`${country}: ${(score * 100).toFixed(2)}%`}</li>
        ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
