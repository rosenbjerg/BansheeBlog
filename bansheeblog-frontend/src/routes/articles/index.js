import { h, Component } from 'preact';
import Markup from 'preact-markup';
import Card from 'preact-material-components/Card';
import 'preact-material-components/Card/style.css';
import 'preact-material-components/Button/style.css';
import style from './style.css';
import Typography from 'preact-material-components/Typography';
import Dialog from 'preact-material-components/Dialog';
import Button from 'preact-material-components/Button';
import Icon from 'preact-material-components/Icon';
import 'preact-material-components/Button/style.css';
import 'preact-material-components/Dialog/style.css';
import 'preact-material-components/Typography/style.css';
import { Delete, Get } from '../../Fetcher';
import { route } from 'preact-router';
import Globals from '../../Globals';

export default class Articles extends Component {

	state = {
		articles: []
	};

	articleToDelete = undefined;

	openDeletePrompt = article => () => {
		this.articleToDelete = article;
		this.dialog.MDComponent.show();
	};
	deleteArticle = async () => {
		if (!this.articleToDelete) return;
		const response = await Delete('/api/article', this.articleToDelete);
		if (response.ok) {
			this.setState({
				articles: this.state.articles.filter(a => a.Id !== this.articleToDelete.Id)
			});
			Globals.showSnackbar('Article deleted!');
		}
		else {
			Globals.showSnackbar('Could not delete article');
		}
		this.articleToDelete = undefined;
	};

	load = async () => {
		const response = await Get('/api/articles');
		if (response.ok) {
			const articles = await response.json();
			this.setState({ articles });
		}
		else {
			route('/login');
		}
	};

	bindDialog = ref => this.dialog = ref;

	componentDidMount() {
		this.load();
	}

	render(props, state) {
		return (
			<div class={style.home}>
				<Typography headline4>Articles</Typography>
				{state.articles.map(article => {
					if (article.__edit === undefined) {
						article.__edit = () => route(`/admin/editor/${article.Id}`);
						article.__delete = this.openDeletePrompt(article);
					}
					return (
						<Card class={style.card}>
							<div>
								<Typography headline5>{article.Title}</Typography>
								<Icon title="Edit article" onClick={article.__edit}>edit</Icon>
								<Icon title="Delete article" onClick={article.__delete}>delete</Icon>
								<Icon title="Toggle public" class={article.Public ? '' : 'untoggled'} onClick={article.__togglePublic}>public</Icon>
							</div>
							<Typography body1>
								<Markup markup={article.Html} />
							</Typography>
						</Card>
					);
				})}
				{!state.articles.length && (
					<p>No articles created yet. Go to the editor and start typing!</p>
				)}
				<Dialog ref={this.bindDialog} onAccept={this.deleteArticle}>
					<Dialog.Header>Delete article?</Dialog.Header>
					<Dialog.Body>
						Are you sure you want to delete the article?
					</Dialog.Body>
					<Dialog.Footer>
						<Dialog.FooterButton cancel>Decline</Dialog.FooterButton>
						<Dialog.FooterButton accept>Accept</Dialog.FooterButton>
					</Dialog.Footer>
				</Dialog>
			</div>
		);
	}
}
