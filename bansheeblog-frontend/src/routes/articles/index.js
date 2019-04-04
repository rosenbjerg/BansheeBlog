import { h, Component } from 'preact';
import style from './style.css';
import Card from 'preact-material-components/Card';
import Dialog from 'preact-material-components/Dialog';
import Icon from 'preact-material-components/Icon';
import Typography from 'preact-material-components/Typography';
import Markup from 'preact-markup';
import { Delete, Get, Put } from '../../Fetcher';
import { route } from 'preact-router';
import Globals from '../../Globals';

const timeOffset = new Date().getTimezoneOffset();
const formatDate = dateString => {
	const date = new Date(dateString);
	date.setHours(date.getHours() - (timeOffset / 60));
	return date.toLocaleString();
};

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

	togglePublicStatus = article => async () => {
		article.Public = !article.Public;
		const response = await Put(`/api/article/meta`, article);
		if (response.ok){
			this.setState(() => {});
		}
	};

	load = async () => {
		const response = await Get('/api/articles');
		if (response.ok) {
			const articles = await response.json();
			articles.sort((a1, a2) => a1.Created < a2.Created);

			console.log("articles", articles);
			this.setState({ articles });
		}
		else {
			// route('/admin/login');
		}
	};

	bindDialog = ref => this.dialog = ref;

	componentDidMount() {
		this.load();
	}

	renderArticle = article => {
		if (article.__edit === undefined) {
			article.__edit = () => route(`/admin/editor/${article.Id}`);
			article.__delete = this.openDeletePrompt(article);
			article.__togglePublic = this.togglePublicStatus(article);
		}
		return (
			<Card class={style.card}>
				<span class={style.grid}>
					<div className={style.title} title={article.Title}>
						<Typography class="truncate" headline6>{article.Title}</Typography>
					</div>
					<i class={style.created}>
						<Typography subtitle2>{formatDate(article.Created)}</Typography>
						{/*{article.Created !== article.Edited && [*/}
							{/*' edited: ',*/}
							{/*<Typography subtitle2>{dayjs(article.Edited).format("HH:mm DD/MM 'YY")}</Typography>*/}
						{/*]}*/}
					</i>
					<span className={style.content}>
						<Typography body2>
							<Markup class={style.text} markup={article.Html} />
						</Typography>
					</span>
					<span className={style.actions}>
						<Icon class="hoverIcon" title="Edit article" onClick={article.__edit}>edit</Icon>
						<span className={article.Public ? '' : 'untoggled'}>
							<Icon class="hoverIcon" title="Toggle public" onClick={article.__togglePublic}>public</Icon>
						</span>
						<Icon class="hoverIcon" title="Delete article" onClick={article.__delete}>delete</Icon>
					</span>
				</span>
			</Card>
		);
	};

	render(props, state) {
		return (
			<div class={style.home}>
				<Typography class={style.header} headline4>Articles</Typography>
				<div>
					{state.articles.map(this.renderArticle)}
					{!state.articles.length && (
						<p>No articles created yet. Go to the editor and start typing!</p>
					)}
				</div>
				<Dialog ref={this.bindDialog} onAccept={this.deleteArticle}>
					<Dialog.Header>Delete article?</Dialog.Header>
					<Dialog.Body>
						Are you sure you want to delete the article?
					</Dialog.Body>
					<Dialog.Footer>
						<Dialog.FooterButton cancel>No, keep it</Dialog.FooterButton>
						<Dialog.FooterButton accept>Yes, delete it</Dialog.FooterButton>
					</Dialog.Footer>
				</Dialog>
			</div>
		);
	}
}
