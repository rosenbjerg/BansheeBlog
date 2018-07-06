import { h, Component } from 'preact';

import style from './style.pcss';

export default class Header extends Component {
    render() {
        return (
            <nav class={style.navigation}>
                <h2>Test app</h2>
            </nav>
        );
    }
}
