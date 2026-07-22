"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { UiKitSection } from "@/components/ui-kit/ui-kit-section"

const fruits = ["Apple", "Banana", "Cherry", "Date", "Elderberry"]

export function FormsSection() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [sliderValue, setSliderValue] = useState([50])

  return (
    <div className="flex flex-col gap-6">
      <UiKitSection
        id="calendar"
        importPath="@/components/ui/calendar"
        title="Calendar"
      >
        <Calendar
          className="rounded-xl border"
          mode="single"
          onSelect={setDate}
          selected={date}
        />
      </UiKitSection>

      <UiKitSection
        id="checkbox"
        importPath="@/components/ui/checkbox"
        title="Checkbox"
      >
        <FieldGroup className="max-w-sm">
          <Field orientation="horizontal">
            <Checkbox defaultChecked id="terms" />
            <FieldLabel htmlFor="terms">Accept terms and conditions</FieldLabel>
          </Field>
        </FieldGroup>
      </UiKitSection>

      <UiKitSection
        id="combobox"
        importPath="@/components/ui/combobox"
        title="Combobox"
      >
        <Combobox items={fruits}>
          <ComboboxInput placeholder="Select a fruit" showClear />
          <ComboboxContent>
            <ComboboxList>
              <ComboboxEmpty>No results found.</ComboboxEmpty>
              <ComboboxGroup>
                {fruits.map((fruit) => (
                  <ComboboxItem key={fruit} value={fruit}>
                    {fruit}
                  </ComboboxItem>
                ))}
              </ComboboxGroup>
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </UiKitSection>

      <UiKitSection id="field" importPath="@/components/ui/field" title="Field">
        <FieldGroup className="max-w-sm">
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input id="email" placeholder="you@example.com" type="email" />
            <FieldDescription>We will never share your email.</FieldDescription>
          </Field>
        </FieldGroup>
      </UiKitSection>

      <UiKitSection id="input" importPath="@/components/ui/input" title="Input">
        <Input className="max-w-sm" placeholder="Enter text" />
      </UiKitSection>

      <UiKitSection
        id="input-group"
        importPath="@/components/ui/input-group"
        title="Input Group"
      >
        <InputGroup className="max-w-sm">
          <InputGroupAddon>
            <InputGroupText>https://</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput placeholder="example.com" />
        </InputGroup>
      </UiKitSection>

      <UiKitSection
        id="input-otp"
        importPath="@/components/ui/input-otp"
        title="Input OTP"
      >
        <InputOTP maxLength={6}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </UiKitSection>

      <UiKitSection id="label" importPath="@/components/ui/label" title="Label">
        <div className="flex max-w-sm flex-col gap-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" placeholder="Your name" />
        </div>
      </UiKitSection>

      <UiKitSection
        id="native-select"
        importPath="@/components/ui/native-select"
        title="Native Select"
      >
        <NativeSelect className="max-w-sm">
          <NativeSelectOption value="">Select a plan</NativeSelectOption>
          <NativeSelectOption value="free">Free</NativeSelectOption>
          <NativeSelectOption value="pro">Pro</NativeSelectOption>
        </NativeSelect>
      </UiKitSection>

      <UiKitSection
        id="radio-group"
        importPath="@/components/ui/radio-group"
        title="Radio Group"
      >
        <RadioGroup defaultValue="comfortable">
          <Field orientation="horizontal">
            <RadioGroupItem id="r1" value="default" />
            <FieldLabel htmlFor="r1">Default</FieldLabel>
          </Field>
          <Field orientation="horizontal">
            <RadioGroupItem id="r2" value="comfortable" />
            <FieldLabel htmlFor="r2">Comfortable</FieldLabel>
          </Field>
          <Field orientation="horizontal">
            <RadioGroupItem id="r3" value="compact" />
            <FieldLabel htmlFor="r3">Compact</FieldLabel>
          </Field>
        </RadioGroup>
      </UiKitSection>

      <UiKitSection
        id="select"
        importPath="@/components/ui/select"
        title="Select"
      >
        <Select defaultValue="apple">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select a fruit" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="apple">Apple</SelectItem>
              <SelectItem value="banana">Banana</SelectItem>
              <SelectItem value="cherry">Cherry</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </UiKitSection>

      <UiKitSection
        id="slider"
        importPath="@/components/ui/slider"
        title="Slider"
      >
        <Slider
          className="max-w-sm"
          max={100}
          onValueChange={(value) =>
            setSliderValue(Array.isArray(value) ? [...value] : [value])
          }
          step={1}
          value={sliderValue}
        />
      </UiKitSection>

      <UiKitSection
        id="switch"
        importPath="@/components/ui/switch"
        title="Switch"
      >
        <Field orientation="horizontal">
          <Switch id="airplane-mode" />
          <FieldLabel htmlFor="airplane-mode">Airplane mode</FieldLabel>
        </Field>
      </UiKitSection>

      <UiKitSection
        id="textarea"
        importPath="@/components/ui/textarea"
        title="Textarea"
      >
        <Textarea className="max-w-sm" placeholder="Type your message here." />
      </UiKitSection>
    </div>
  )
}
