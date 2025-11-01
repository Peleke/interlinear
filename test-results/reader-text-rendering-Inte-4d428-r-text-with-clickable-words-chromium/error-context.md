# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - link "← Back to Reader" [ref=e5] [cursor=pointer]:
        - /url: /reader
        - generic [ref=e6]: ←
        - text: Back to Reader
      - heading "Profile" [level=1] [ref=e7]
      - paragraph [ref=e8]: Your account and learning progress
    - generic [ref=e9]:
      - heading "Account" [level=2] [ref=e10]
      - generic [ref=e11]:
        - generic [ref=e12]:
          - text: Email
          - paragraph [ref=e13]: test-1762024802732@example.com
        - generic [ref=e14]:
          - text: Member Since
          - paragraph [ref=e15]: November 1, 2025
    - generic [ref=e16]:
      - heading "Learning Progress" [level=2] [ref=e17]
      - generic [ref=e18]:
        - generic [ref=e19]:
          - generic [ref=e20]: "0"
          - generic [ref=e21]: Total Words Saved
        - generic [ref=e22]:
          - generic [ref=e23]: "0"
          - generic [ref=e24]: Added This Week
      - link "View All Vocabulary →" [ref=e26] [cursor=pointer]:
        - /url: /vocabulary
    - generic [ref=e27]:
      - heading "Actions" [level=2] [ref=e28]
      - button "Sign Out" [ref=e30] [cursor=pointer]
  - region "Notifications alt+T"
  - alert [ref=e31]
```