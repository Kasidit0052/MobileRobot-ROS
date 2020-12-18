import expect from 'expect'
import React from 'react'
import {render, unmountComponentAtNode} from 'react-dom'

import Component from 'src/'

describe('Component', () => {
  let node

  beforeEach(() => {
    node = document.createElement('div')
  })

  afterEach(() => {
    unmountComponentAtNode(node)
  })

  it('is nonsense', () => true)

  // it('Can render', () => {
  //   render(<Component id='random' width={750} height={800} serverName='/move_base'/>, node, () => {
  //   })
  // })
})
