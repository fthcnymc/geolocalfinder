import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { BarLoader } from 'react-spinners';
import Chart from 'chart.js/auto';
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
  const [loading, setLoading] = useState(false);
  const chartRef = useRef(null);

  const handleFileChange = async (event) => {
    if (chartRef.current && chartRef.current.chart) {
      chartRef.current.chart.destroy();
    }
    const file = event.target.files[0];
    setSelectedFile(file);

    if (file) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        setLoading(true); // Set loading to true when the file is being processed

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

        // Render the new chart
        renderChart();
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false); // Set loading back to false when the process is complete
      }
    }
  };

  const renderChart = () => {
    // Clear the chart before rendering
    if (chartRef.current && chartRef.current.chart) {
      chartRef.current.chart.destroy();
    }
  
    if (!loading && classificationResult) {
      // Convert the classification result object to an array of objects
      const data = Object.entries(classificationResult)
        .map(([label, value]) => ({ label, value }))
        // Sort the array based on the values in descending order
        .sort((a, b) => b.value - a.value)
        // Multiply the values by 100 to show percentages
        .map(item => ({ ...item, value: item.value * 100 }));
  
      const ctx = chartRef.current.getContext('2d');
      chartRef.current.chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: data.map(item => item.label),
          datasets: [
            {
              label: 'Confidence Level',
              data: data.map(item => item.value),
              backgroundColor: 'rgba(75, 192, 192, 0.7)',
            },
          ],
        },
        options: {
          responsive: true,
          aspectRatio: 10,
          scales: {
            x: {
              type: 'category',
            },
            y: {
              beginAtZero: true,
              max: 100, // Set the maximum value for the y-axis to 100
            },
          },
        },
      });
    }
  };
  
  // Call renderChart in the useEffect hook to render the chart initially and when classificationResult changes
  useEffect(() => {
    renderChart();
  }, [classificationResult]);

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
        {loading && (
          <BarLoader
            color="#00BFFF"
            height={5}
            width={150}
            loading={loading}
            style={{ margin: '20px auto', display: 'block' }}
          />
        )}
        {selectedFile && (
        <div>
          <p>Selected File: {selectedFile.name}</p>
          <img
            src={URL.createObjectURL(selectedFile)}
            alt="Selected Preview"
            style={{ display: 'block', maxWidth: '100%', maxHeight: '500px', margin: '10px auto' }}
          />
        </div>
        )}
        {classificationResult && (
          <div>
            {/* Use the chart canvas */}
            <canvas ref={chartRef}></canvas>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;