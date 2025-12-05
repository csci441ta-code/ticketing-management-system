import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import HeaderBar from '../src/components/HeaderBar.vue'

// Mock the auth store used by the component
vi.mock('../src/store/auth.js', () => ({
  useAuthStore: () => ({
    user: {
      name: 'Test User',
      email: 'test@example.com',
      role: 'ADMIN'
    }
  })
}))

describe('HeaderBar.vue', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(HeaderBar)
  })

  it('renders the app title', () => {
    expect(wrapper.text()).toContain('TigerTrack Solutions')
  })

  it('emits "open-settings" when settings button is clicked', async () => {
    const settingsButton = wrapper.get('button.icon-button')
    await settingsButton.trigger('click')

    expect(wrapper.emitted('open-settings')).toBeTruthy()
  })

  it('toggles profile dropdown when profile icon is clicked', async () => {
    const profileIcon = wrapper.get('.profile-menu i')

    // Initially dropdown should not be visible
    expect(wrapper.find('.dropdown').exists()).toBe(false)

    await profileIcon.trigger('click')
    expect(wrapper.find('.dropdown').exists()).toBe(true)

    // Click again to hide
    await profileIcon.trigger('click')
    expect(wrapper.find('.dropdown').exists()).toBe(false)
  })

  it('shows profile modal with user info when Profile is clicked', async () => {
    const profileIcon = wrapper.get('.profile-menu i')

    // Open dropdown
    await profileIcon.trigger('click')

    const dropdownButtons = wrapper.findAll('.dropdown button')
    const profileButton = dropdownButtons[0]

    await profileButton.trigger('click')

    const modal = wrapper.find('.modal')
    expect(modal.exists()).toBe(true)
    expect(modal.text()).toContain('Test User')
    expect(modal.text()).toContain('test@example.com')
    expect(modal.text()).toContain('ADMIN')
  })

  it('emits "logout" when Logout is clicked', async () => {
    const profileIcon = wrapper.get('.profile-menu i')

    // Open dropdown
    await profileIcon.trigger('click')

    const dropdownButtons = wrapper.findAll('.dropdown button')
    const logoutButton = dropdownButtons[1]

    await logoutButton.trigger('click')

    expect(wrapper.emitted('logout')).toBeTruthy()
  })

  it('closes profile modal when Close button is clicked', async () => {
    const profileIcon = wrapper.get('.profile-menu i')

    // Open dropdown and then profile modal
    await profileIcon.trigger('click')
    const dropdownButtons = wrapper.findAll('.dropdown button')
    const profileButton = dropdownButtons[0]
    await profileButton.trigger('click')

    // Ensure modal is visible
    expect(wrapper.find('.modal').exists()).toBe(true)

    // Click Close
    const closeBtn = wrapper.get('.modal .close-btn')
    await closeBtn.trigger('click')

    expect(wrapper.find('.modal').exists()).toBe(false)
  })
})
