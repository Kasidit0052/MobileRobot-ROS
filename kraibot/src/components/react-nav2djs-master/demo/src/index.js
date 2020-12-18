import React, {Component} from 'react'
import {render} from 'react-dom'

import Example from '../../src'

class Demo extends Component {
  render() {
    return <div>
      <h1>react-nav2djs Demo</h1>
      <Example id='random' width={750} height={800} serverName='/move_base'/>
    </div>
  }
}

render(<Demo/>, document.querySelector('#demo'))
