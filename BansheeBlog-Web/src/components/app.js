import { h, Component } from 'preact';
import Header from './header';

import '../index.css'

export default class App extends Component {
    constructor(props) {
        super(props);
        this.buttonPress = this.buttonPress.bind(this);
        this.state = {
            clicks: 0
        };
    }

    buttonPress() {
        this.setState(oldState => {
            oldState.clicks++;
        })
    }

	render() {
		return (
			<div>
                <Header />
                <img src="../assets/favicon.ico" alt=""/>
                Hello world
                <p>Button clicked {this.state.clicks} times</p>
                <button onClick={this.buttonPress}>+</button>
			</div>
		);
	}
}
