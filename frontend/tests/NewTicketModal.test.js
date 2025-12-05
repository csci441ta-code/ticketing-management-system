import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import { defineComponent, h } from 'vue'
import { createPinia } from 'pinia'
import NewTicketModal from '../src/components/NewTicketModal.vue'

// ----- Stubs for vee-validate components -----
const FormStub = defineComponent({
  name: 'Form',
  setup(_, { slots }) {
    // Provide handleSubmit to match <Form v-slot="{ handleSubmit }">
    const slotProps = {
      handleSubmit: (fn) => fn
    }

    return () =>
      h(
        'div',
        null,
        slots.default ? slots.default(slotProps) : null
      )
  }
})

const FieldStub = defineComponent({
  name: 'Field',
  props: {
    name: String,
    as: String
  },
  setup(props, { attrs }) {
    return () => {
      const tag = props.as || 'input'
      return h(tag, { ...attrs, name: props.name })
    }
  }
})

const ErrorMessageStub = defineComponent({
  name: 'ErrorMessage',
  props: {
    name: String
  },
  setup() {
    return () => null
  }
})

// Shared pinia instance for tests
const pinia = createPinia()

const mountModal = (visible) =>
  mount(NewTicketModal, {
    props: { visible },
    global: {
      plugins: [pinia],
      stubs: {
        Form: FormStub,
        Field: FieldStub,
        ErrorMessage: ErrorMessageStub
      }
    }
  })

describe('NewTicketModal.vue', () => {
  it('does not render when visible is false', () => {
    const wrapper = mountModal(false)

    expect(wrapper.find('h2').exists()).toBe(false)
  })

  it('renders when visible is true', () => {
    const wrapper = mountModal(true)

    const heading = wrapper.find('h2')
    expect(heading.exists()).toBe(true)
    expect(heading.text()).toBe('Create New Ticket')
  })

  it('has title, description, and priority fields', () => {
    const wrapper = mountModal(true)

    expect(wrapper.find('input[name="title"]').exists()).toBe(true)
    expect(wrapper.find('textarea[name="description"]').exists()).toBe(true)
    expect(wrapper.find('select[name="priority"]').exists()).toBe(true)
  })

  it('emits "close" when Cancel button is clicked', async () => {
    const wrapper = mountModal(true)

    const cancelButton = wrapper.get('button[type="button"]')
    await cancelButton.trigger('click')

    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('emits "close" when top-right close button is clicked', async () => {
    const wrapper = mountModal(true)

    const buttons = wrapper.findAll('button')
    const closeIconButton = buttons[buttons.length - 1]

    await closeIconButton.trigger('click')

    expect(wrapper.emitted('close')).toBeTruthy()
  })
})
