import React from 'react';
import logo from './logo.svg';
import './App.css';
import './styles/index.scss';
import Button, { ButtonType, ButtonSize } from './components/Button/button';

function App() {
	return (
		<div className="App">
			<header className="App-header">
				<Button
					onClick={() => console.log('sss')}
					btnType={ButtonType.Danger}
				>
					ssss
				</Button>
				<Button disabled>ssss</Button>
				<Button size={ButtonSize.large} btnType={ButtonType.Primary}>
					aa
				</Button>
				<Button btnType={ButtonType.Link} href="#">
					dfdd
				</Button>
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
