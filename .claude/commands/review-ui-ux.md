# Review UI/UX Quality

Performs a comprehensive UI/UX quality analysis of React components, checking for:

- **Accessibility**: WCAG 2.1 compliance, keyboard navigation, screen reader support, ARIA labels, color contrast
- **Responsive Design**: Mobile-first approach, Tailwind breakpoints, touch-friendly sizing (44px minimum)
- **User Experience**: Visual hierarchy, intuitive navigation, error handling, loading states, form feedback
- **Performance**: Component optimization, unnecessary re-renders, CSS efficiency
- **Visual Consistency**: Color palette, typography scale, spacing, icon usage
- **Best Practices**: React patterns, error boundaries, prop validation

## Usage

```
/review-ui-ux
```

The command will analyze the currently open file or selected code in the editor for UI/UX quality issues and provide:
1. Strengths - what's working well
2. Issues - problems found with priority levels
3. Recommendations - specific improvements
4. Code examples - how to fix issues

## What Gets Checked

### Accessibility Checklist
- [ ] Semantic HTML (`<button>`, `<label>`, `<form>`)
- [ ] ARIA attributes where needed
- [ ] Color contrast ratios (4.5:1 for text)
- [ ] Keyboard navigation support
- [ ] Screen reader compatibility
- [ ] Focus indicators visible
- [ ] Alt text for images

### Responsive Design Checklist
- [ ] Mobile-first CSS approach
- [ ] Flexible containers and layouts
- [ ] Touch-friendly button sizes (44px+)
- [ ] Proper breakpoint usage
- [ ] Mobile-optimized typography
- [ ] Adequate spacing on mobile
- [ ] No horizontal scrolling

### User Experience Checklist
- [ ] Clear visual hierarchy
- [ ] Intuitive navigation flow
- [ ] Loading states for async operations
- [ ] Error messages are clear and helpful
- [ ] Form validation feedback
- [ ] Success/confirmation feedback
- [ ] No ambiguous labels or buttons

### Performance Checklist
- [ ] No unnecessary re-renders
- [ ] Proper React hooks usage
- [ ] Optimized images
- [ ] Lazy loading where appropriate
- [ ] Efficient event handlers
- [ ] Memoization where needed

### Visual Consistency Checklist
- [ ] Color palette alignment
- [ ] Consistent spacing (Tailwind scale)
- [ ] Typography consistency
- [ ] Icon library alignment
- [ ] Button styles consistent
- [ ] Form field styling consistent

## Example Output

```
## UI/UX Quality Review: LoginScreen.tsx

### ✅ Strengths
- Clean semantic form structure
- Proper input type attributes
- Good visual hierarchy
- Accessible focus states

### ⚠️ Priority Issues
1. **HIGH**: No loading state during authentication
2. **HIGH**: Missing accessibility labels
3. **MEDIUM**: Error messages not field-specific
4. **MEDIUM**: No visual feedback during submission

### 💡 Recommendations
- Add loading spinner during login
- Add aria-label to form fields
- Show field-level validation errors
- Disable button while loading

### 📝 Code Examples
[Provided with fixes]
```

## Tips

- Select a specific component to review just that component
- Leave nothing selected to review the entire file
- Use this before creating PR/commits
- Apply recommendations incrementally
