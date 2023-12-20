import React, { useState } from 'react';
import styled from 'styled-components';
import './App.css';

const FileInputContainer = styled.label`
  display: inline-block;
  padding: 10px 15px;
  font-size: 16px;
  font-weight: bold;
  color: white;
  background-color: grey;
  border: 1px solid #ccc;
  border-radius: 5px;
  cursor: pointer;
  &:hover {
    background-color: #1f3661;
  }
  input {
    display: none;
  }
`;

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [classificationResult, setClassificationResult] = useState(null);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);

    if (file) {
      const formData = new FormData();
      formData.append('file', file);

      try {
      
        const uploadResponse = await fetch('http://localhost:5000/upload', {
          method: 'POST',
          body: formData,
        });

        const uploadData = await uploadResponse.json();
        console.log(uploadData); 

   
        const classifyResponse = await fetch('http://localhost:5000/classify', {
          method: 'POST',
          body: formData,
        });

        const classifyData = await classifyResponse.json();
        setClassificationResult(classifyData); 
        console.log(classifyData); 
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome GeoFinder</h1>
        <p style={{ fontStyle: 'italic' }}>Let's Start !</p>
      </header>
      <main>
        <FileInputContainer>
          Choose Image
          <input
            type="file"
            accept=".jpg, .jpeg, .png"
            onChange={handleFileChange}
          />
        </FileInputContainer>
        {selectedFile && (
          <div>
            <p>Selected File: {selectedFile.name}</p>
            <img
              src={URL.createObjectURL(selectedFile)}
              alt="Selected Preview"
              style={{ maxWidth: '100%', maxHeight: '500px' }}
            />
          </div>
        )}
        {classificationResult && (
          <div>
            <h2>Classification Result:</h2>
            <ul>
              {Object.entries(classificationResult)
                .sort(([, score1], [, score2]) => score2 - score1)
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