import React from 'react';
import logo from './logo.svg';
import './App.css';
import './styles/index.scss';
import Button from './components/Button';

function App() {
	return (
		<div className="App">
			<header className="App-header">
				<Button btnType="default">5456416 </Button>
				<p>
					Edit <code>src/App.tsx</code> and save to reload.
				</p>
				<a
					className="App-link"
					href="https://reactjs.org"
					target="_blank"
					rel="noopener noreferrer"
				>
					Learn React
				</a>
			</header>
		</div>
	);
}

export default App;
