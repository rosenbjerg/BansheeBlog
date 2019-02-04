import { h, Component } from 'preact';
import style from './style.css';
import TokenInput from 'preact-token-input';
import Icon from 'preact-material-components/Icon';
import TextField from 'preact-material-components/TextField';
import Typography from 'preact-material-components/Typography';
import 'preact-material-components/Icon/style.css';
import 'preact-material-components/TextField/style.css';
import 'preact-material-components/Typography/style.css';
import { Get, Put } from '../../Fetcher';

import SimpleMDE from 'simplemde';
import 'simplemde/dist/simplemde.min.css';

import linkState from 'linkstate';
import Globals from '../../Globals';

const slugify = input =>
	input.toLowerCase()
		.replace(/\s+/g, '-')           // Replace spaces with -
		.replace(/[^\w\-]+/g, '')       // Remove all non-word chars
		.replace(/\-\-+/g, '-')         // Replace multiple - with single -
		.replace(/^-+/, '')             // Trim - from start of text
		.replace(/-+$/, '')            // Trim - from end of text
;
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
			const metaPromise = Get(`/api/article/${this.props.articleId}`).then(response => response.json());
			const markdownPromise = Get(`/api/article/${this.props.articleId}/markdown`).then(response => response.json());

			const articleData = await Promise.all([ metaPromise, markdownPromise ]);
			const meta = articleData[0];
			const markdown = articleData[1];

			this.setState({
				id: meta.Id,
				title: meta.Title,
				slug: meta.Slug,
				tags: meta.Tags.split('\n'),
				created: meta.Created,
				lastEdit: meta.Edited,
				public: meta.Public,
				markdown: markdown.Content
			}, loadMde);
			console.log(meta.Id);
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
			Title: this.state.title,
			Slug: this.state.slug,
			Markdown: this.state.markdown,
			Tags: this.state.tags.join('\n'),
			Public: this.state.public,
			Created: new Date(),
			Edited: new Date()
		};
		if (this.props.articleId) {
			article.Id = this.state.id;
			article.Created = this.state.created;
		}
		const response = await Put('/api/article', article);
		if (response.ok) {
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

	setTitle = ev => {
		const title = ev.target.value;
		this.setState({
			slug: slugify(title),
			title
		});
	};

	componentDidMount() {
		this.load();
	}

	render(props, state) {
		return (
			<div class={style.home}>
				<div>
					<Typography headline4>Article editor</Typography>
					<Icon title="Toggle public" class={state.public ? '' : 'untoggled'} onClick={this.togglePublic}>public</Icon>
					<Icon title="Save article" onClick={this.save}>save</Icon>
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
