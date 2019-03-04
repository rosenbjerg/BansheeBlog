import { Component } from 'preact';
import filesize from 'filesize';
import style from './style.css';

import FormField from 'preact-material-components/FormField';
import 'preact-material-components/FormField/style.css';
import Icon from 'preact-material-components/Icon';
import 'preact-material-components/Icon/style.css';
import Fab from 'preact-material-components/Fab';
import 'preact-material-components/Fab/style.css';


export default class Uploader extends Component {

	state = {
		selected: []
	};

	id = '_uploader_' + Math.random();

	fileDrag = e => {
		e.stopPropagation();
		e.preventDefault();
	};
	fileDrop = e => {
		e.stopPropagation();
		e.preventDefault();
		const selected = e.dataTransfer.files;
		this.setState({ selected });
		if (this.props.onChange)
			this.props.onChange(selected);
	};
	filesChanged = e => {
		e.stopPropagation();
		e.preventDefault();
		const selected = Array.from(e.target.files);
		this.setState({ selected });
		if (this.props.onChange)
			this.props.onChange(selected);
	};
	bindFileUpl = ref => this.fileUpl = ref;
	fileUplClick = () => this.fileUpl.click();

	formatFile = file => `${file.name} (${filesize(file.size)})`;

	formatFiles = files => {
		const all = `${files.length} file${(files.length > 1 ? 's' : '')}: ${files.map(this.formatFile).join(', ')}`;
		if (all.length > 100)
			return all.substr(0, 97) + '...';
		return all;
	};

	componentWillUpdate(nextProps, nextState, nextContext) {
		if (nextState.selected)
			nextState.selected = nextProps.selected;
	}

	render({ selected, onChange, ...props }, state) {
		return (
			<label style={style.dropLabel} htmlFor={this.id} onDragOver={this.fileDrag} onDragEnter={this.fileDrag}
				   onDrop={this.fileDrop}
			>
				<FormField>
					<Fab onClick={this.fileUplClick}>
						<Icon>file_upload</Icon>
					</Fab>
					<span style={{ 'margin-left': '8px' }}>
						{(state.selected && state.selected.length > 0) ? this.formatFiles(state.selected) : 'Select file'}
					</span>
				</FormField>
				<input {...props} onChange={this.filesChanged} type="file" ref={this.bindFileUpl} className={style.invis} id={this.id} />
			</label>
		);
	}
}