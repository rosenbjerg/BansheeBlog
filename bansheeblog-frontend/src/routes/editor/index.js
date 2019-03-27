import { h, Component } from 'preact';
import style from './style.css';
import TokenInput from 'preact-token-input';
import { Get, Put } from '../../Fetcher';
import Globals from '../../Globals';
import {route} from "preact-router";
import slugify from 'slugify';
import SimpleMDE from 'simplemde';
import 'simplemde/dist/simplemde.min.css';

import Icon from 'preact-material-components/Icon';
import TextField from 'preact-material-components/TextField';
import Typography from 'preact-material-components/Typography';

export default class Editor extends Component {

	state = {
		id: '',
		title: '',
		slug: '',
		markdown: '',
		tags: [],
		created: '',
		lastEdit: '',
		public: false
	};

	load = async () => {
		const loadMde = () => {
			this.mde = new SimpleMDE({
				element: this.textarea,
				initialValue: this.state.markdown,
				placeholder: 'Write the article here..'
			});
		};

		if (this.props.articleId) {
			this.articleId = this.props.articleId;
			const metaPromise = Get(`/api/article/${this.articleId}`).then(response => response.json());
			const markdownPromise = Get(`/api/article/${this.articleId}/markdown`).then(response => response.json());

			const articleData = await Promise.all([ metaPromise, markdownPromise ]);
			const meta = articleData[0];
			const markdown = articleData[1];

			this.setState({
				id: meta.Id,
				slug: meta.Slug,
				title: meta.Title,
				tags: meta.Tags.split('\n'),
				created: meta.Created,
				lastEdit: meta.Edited,
				public: meta.Public,
				markdown: markdown.Content
			}, loadMde);
		}
		else
			loadMde();
	};

	save = async () => {
		if (this.state.title === '') {
			Globals.showSnackbar('The article must at least have a title');
			return;
		}
		this.state.markdown = this.mde.value();
		const article = {
			Slug: this.state.slug,
			Title: this.state.title,
			Tags: this.state.tags.join('\n'),
			Markdown: this.state.markdown,
			Public: this.state.public,
			Created: new Date(),
			Edited: new Date()
		};
		if (this.articleId) {
			article.Id = this.articleId;
			article.Created = this.state.created;
		}
		const response = await Put('/api/article', article);
		if (response.ok) {
			if (!this.articleId) {
				this.articleId = await response.text();
				route(`/admin/editor/${this.articleId}`, true);
				this.setState({
					id: article.Id,
					slug: article.Slug,
					title: article.Title,
					tags: article.Tags.split('\n'),
					created: article.Created,
					lastEdit: article.Edited,
					public: article.Public
				});
			}
			Globals.showSnackbar('Article saved!');
		}
		else {
			const error = await response.text();
			Globals.showSnackbar(error);
		}
	};

    bindTextarea = ref => this.textarea = ref;


    togglePublic = () => {
    	const publicState = !this.state.public;
    	this.setState({
    		public: publicState
    	});
    };

    updateTags = ev => this.setState({ tags: ev.value });

	gotoArticle = () => {
		window.open(`/article/${this.state.slug}`, '_blank');
	};

	setTitle = ev => {
		const title = ev.target.value;
		const slug = slugify(title);
		this.setState({ title, slug });
	};

	componentDidMount() {
		this.load();
	}

	render(props, state) {
		let shortcut = state.id && state.public;
		return (
			<div class={style.home}>
				<div>
					<Typography headline4>Article editor</Typography>
					<Icon title="Toggle public" class={'hoverIcon' + (state.public ? '' : ' untoggled')} onClick={this.togglePublic}>public</Icon>
					<Icon class="hoverIcon" title="Save article" onClick={this.save}>save</Icon>
					{shortcut && (<Icon class="hoverIcon" title="Go to article" onClick={this.gotoArticle}>open_in_new</Icon>)}
				</div>
				<div>
					<TextField className="fullwidth" label="Title" value={state.title} onInput={this.setTitle} />
				</div>
				<div>
					<Typography caption>slug: {state.slug}</Typography>
				</div>
				<TokenInput placeholder="Tags" value={state.tags} onChange={this.updateTags} />
				<div>
					<textarea ref={this.bindTextarea} />
				</div>
			</div>
		);
	}
}
