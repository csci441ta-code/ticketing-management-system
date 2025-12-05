import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import FilterBar from '../src/components/FilterBar.vue'

describe('FilterBar.vue', () => {
  it('emits "create" when New button is clicked', async () => {
    const wrapper = mount(FilterBar)

    await wrapper.find('button.new-btn').trigger('click')

    expect(wrapper.emitted('create')).toBeTruthy()
  })

  it('emits "search" with updated text when input changes', async () => {
    const wrapper = mount(FilterBar)

    const input = wrapper.find('input.filter-input')
    await input.setValue('hello world')

    // emitted once per input event
    expect(wrapper.emitted('search')).toBeTruthy()
    expect(wrapper.emitted('search')[0]).toEqual(['hello world'])
  })

  it('emits "toggle-assigned" when checkbox is toggled', async () => {
    const wrapper = mount(FilterBar)

    const checkbox = wrapper.find('input[type="checkbox"]')

    // simulate checking it
    await checkbox.setValue(true)

    expect(wrapper.emitted('toggle-assigned')).toBeTruthy()
    expect(wrapper.emitted('toggle-assigned')[0]).toEqual([true])

    // simulate unchecking it
    await checkbox.setValue(false)

    expect(wrapper.emitted('toggle-assigned')[1]).toEqual([false])
  })
})
