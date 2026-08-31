"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      richColors
      icons={{
        success: (
          <CircleCheckIcon className="size-5 text-green-600" />
        ),
        info: (
          <InfoIcon className="size-5 text-blue-600" />
        ),
        warning: (
          <TriangleAlertIcon className="size-5 text-yellow-600" />
        ),
        error: (
          <OctagonXIcon className="size-5 text-red-600" />
        ),
        loading: (
          <Loader2Icon className="size-5 animate-spin text-gray-600" />
        ),
      }}
      toastOptions={{
        classNames: {
          toast: "group toast flex gap-3 p-4 border rounded-lg shadow-lg font-medium",
          description: "text-sm opacity-90",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
