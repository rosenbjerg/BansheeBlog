import { h, Component } from 'preact';
import Card from 'preact-material-components/Card';
import 'preact-material-components/Card/style.css';
import 'preact-material-components/Button/style.css';
import style from './style.css';
import Typography from 'preact-material-components/Typography';
import 'preact-material-components/Typography/style.css';
import { Get } from '../../Fetcher';
import { route } from 'preact-router';

export default class Articles extends Component {

	state = {
		articles: []
	};

	load = async () => {
		const response = await Get('/api/articles');
		if (response.ok) {
        	const articles = await response.json();
        	console.log(articles);
        	this.setState({ articles });
		}
		else {
			route('/login');
		}
	};

	componentDidMount() {
		this.load();
	}

	render() {
		return (
			<div class={style.home}>
				<Typography headline4>Articles</Typography>
				<Card>
					<div class={style.cardHeader}>
						<h2 class=" mdc-typography--title">Home card</h2>
						<div class=" mdc-typography--caption">Welcome to home route</div>
					</div>
					<div class={style.cardBody}>
						Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.
					</div>
					<Card.Actions>
						<Card.ActionButton>OKAY</Card.ActionButton>
					</Card.Actions>
				</Card>
			</div>
		);
	}
}
