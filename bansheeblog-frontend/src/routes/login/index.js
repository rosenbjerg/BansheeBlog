import { h, Component } from 'preact';
import Card from 'preact-material-components/Card';
import 'preact-material-components/Card/style.css';
import 'preact-material-components/Button/style.css';
import Typography from 'preact-material-components/Typography';
import 'preact-material-components/Typography/style.css';
import { Get } from '../../Fetcher';
import { route } from 'preact-router';
import TextField from 'preact-material-components/TextField';
import 'preact-material-components/TextField/style.css';

const cardStyle = {

};

export default class Articles extends Component {
    load = async () => {
    	const response = await Get('/api/verify');
    	if (response.ok) {
    		route('/');
    	}
    };

    componentDidMount() {
    	this.load();
    }

    render() {
    	return (
    		<div style={cardStyle}>
    			<Typography headline4>Admin login</Typography>
    			<Card>
    				<TextField />
    				<TextField />
    				<Card.Actions>
    					<Card.ActionButton>OKAY</Card.ActionButton>
    				</Card.Actions>
    			</Card>
    		</div>
    	);
    }
}
