import { motion } from 'framer-motion'
import { Plus, Trash2 } from 'lucide-react'
import { itemKey } from '../../lib/utils'
import type { Errors, Item, RepeatConfig, Scalar } from '../../types'
import FieldGroup from './FieldGroup'
import FieldInput from './FieldInput'

interface Props {
  config: RepeatConfig
  gateValue: Scalar | undefined
  items: Item[]
  errors: Errors
  onGateChange: (value: Scalar) => void
  onItemChange: (index: number, fieldId: string, value: Scalar) => void
  onAdd: () => void
  onRemove: (index: number) => void
}

export default function RepeatSection({
  config,
  gateValue,
  items,
  errors,
  onGateChange,
  onItemChange,
  onAdd,
  onRemove,
}: Props) {
  return (
    <div className="repeat">
      <FieldInput
        field={config.gate}
        value={gateValue}
        error={errors[config.gate.id]}
        domId={`gate-${config.gate.id}`}
        onChange={onGateChange}
      />

      {gateValue === 1 && (
        <div className="repeat__items">
          {items.map((item, i) => (
            <motion.section
              key={i}
              className="repeat__item"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              aria-label={`${config.itemTitle} ${i + 1}`}
            >
              <header className="repeat__item-header">
                <h2>
                  {config.itemTitle} {i + 1}
                </h2>
                {items.length > 1 && (
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => onRemove(i)}
                    aria-label={`Quitar ${config.itemTitle.toLowerCase()} ${i + 1}`}
                  >
                    <Trash2 size={18} />
                    <span>Quitar</span>
                  </button>
                )}
              </header>
              <FieldGroup
                fields={config.fields}
                values={item}
                errors={errors}
                idPrefix={`item${i}`}
                keyOf={(id) => itemKey(i, id)}
                onChange={(fieldId, v) => onItemChange(i, fieldId, v)}
              />
            </motion.section>
          ))}

          {errors._items && (
            <p className="field__error" role="alert">
              {errors._items}
            </p>
          )}

          <button type="button" className="btn btn--dashed" onClick={onAdd}>
            <Plus size={18} />
            {config.addLabel}
          </button>
        </div>
      )}
    </div>
  )
}
