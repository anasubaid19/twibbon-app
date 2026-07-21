import type * as React from 'react'

import { cn } from '@/lib/utils'

function Label({ className, ...props }: React.ComponentProps<'label'>) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: komponen label generik tidak bisa tahu kontrolnya saat didefinisikan — pengaitan terjadi di pemanggil lewat htmlFor, dan di sanalah aturan ini berlaku.
    <label
      data-slot="label"
      className={cn(
        'flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export { Label }
