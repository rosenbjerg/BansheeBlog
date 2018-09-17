import { h, Component } from 'preact';
import { route } from 'preact-router';
import Toolbar from 'preact-material-components/Toolbar';
import 'preact-material-components/Toolbar/style.css';
import style from './style.css';

export default class Header extends Component {

	render() {
		return (
			<div>
				<Toolbar class={style.toolbar}>
					<Toolbar.Row>
						<Toolbar.Section align-start>
							<Toolbar.Title class={style.title}>BansheeBlog</Toolbar.Title>
                            <Toolbar.Icon>edit</Toolbar.Icon>
                            <Toolbar.Icon>view_list</Toolbar.Icon>
                            <Toolbar.Icon>settings</Toolbar.Icon>
						</Toolbar.Section>
						<Toolbar.Section align-end shrink-to-fit>
							<Toolbar.Icon>exit_to_app</Toolbar.Icon>
						</Toolbar.Section>
					</Toolbar.Row>
				</Toolbar>
			</div>
		);
	}
}
