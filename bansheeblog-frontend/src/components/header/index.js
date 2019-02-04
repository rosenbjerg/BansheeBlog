import { h, Component } from 'preact';
import { route } from 'preact-router';
import TopAppBar from 'preact-material-components/TopAppBar';
import 'preact-material-components/TopAppBar/style.css';
import style from './style.css';

export default class Header extends Component {

    openEditor = () => route('/admin/editor');
    openArticles = () => route('/admin/');
    openSettings = () => route('/admin/settings');

    render() {
    	return (
    		<div>
    			<TopAppBar className="topappbar">
    				<TopAppBar.Row>
    					<TopAppBar.Section align-start>
    						<TopAppBar.Title onClick={this.openArticles} class={style.title}>BansheeBlog</TopAppBar.Title>
    						<TopAppBar.Icon title="Write new article" onClick={this.openEditor}>edit</TopAppBar.Icon>
    						<TopAppBar.Icon title="All articles" onClick={this.openArticles}>view_list</TopAppBar.Icon>
    						<TopAppBar.Icon title="Change settings" onClick={this.openSettings}>settings</TopAppBar.Icon>
    					</TopAppBar.Section>
    					<TopAppBar.Section align-end shrink-to-fit>
    						<TopAppBar.Icon>exit_to_app</TopAppBar.Icon>
    					</TopAppBar.Section>
    				</TopAppBar.Row>
    			</TopAppBar>
    		</div>
    	);
    }
}
