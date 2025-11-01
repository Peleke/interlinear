# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - heading "Create Account" [level=1] [ref=e5]
      - paragraph [ref=e6]: Start building your Spanish vocabulary
    - generic [ref=e7]:
      - generic [ref=e8]:
        - generic [ref=e9]: Email
        - textbox "Email" [active] [ref=e10]: notanemail
      - generic [ref=e11]:
        - generic [ref=e12]: Password
        - textbox "Password" [ref=e13]: ValidPass123!
        - paragraph [ref=e14]: Minimum 8 characters
      - button "Sign Up" [ref=e15] [cursor=pointer]
    - paragraph [ref=e16]:
      - text: Already have an account?
      - link "Log in" [ref=e17] [cursor=pointer]:
        - /url: /login
  - region "Notifications alt+T"
  - alert [ref=e18]
```