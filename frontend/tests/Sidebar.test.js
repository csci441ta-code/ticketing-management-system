import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import Sidebar from '../src/components/Sidebar.vue'

describe('Sidebar.vue', () => {
  it('renders title, role label, and Dashboard item', () => {
    const wrapper = mount(Sidebar, {
      global: {
        // Stub router-link so we don't need a real router in unit tests
        stubs: {
          'router-link': {
            template: '<a><slot /></a>'
          }
        }
      }
    })

    // Title
    expect(wrapper.text()).toContain('Ticket Manager')

    // Default role label (anything not "admin" becomes "Employee")
    expect(wrapper.text()).toContain('Employee')

    // Base nav item
    expect(wrapper.text()).toContain('Dashboard')
  })
})
