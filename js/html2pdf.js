// Simple PDF export wrapper using html2canvas and jsPDF
// This module provides html2pdf functionality for local PDF generation

(function(global) {
  // If html2pdf (external library) is not available, provide a fallback
  if (!global.html2pdf) {
    global.html2pdf = function(options) {
      var state = 0;
      var sourceElement = null;
      var opts = Object.assign({
        margin: 10,
        filename: 'document.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }, options || {});

      return {
        set: function(newOpts) {
          opts = Object.assign({}, opts, newOpts);
          return this;
        },
        from: function(element) {
          sourceElement = element;
          state = 1;
          return this;
        },
        save: function(filename) {
          if (!sourceElement) {
            console.error('No element set for PDF export');
            return;
          }
          filename = filename || opts.filename || 'document.pdf';
          exportToPDF(sourceElement, filename, opts);
          return this;
        },
        output: function(type) {
          return null;
        }
      };
    };

    function exportToPDF(element, filename, options) {
      // Try to use html2canvas and jsPDF if available
      if (typeof html2canvas !== 'undefined' && typeof jsPDF !== 'undefined') {
        html2canvas(element, {
          scale: (options.html2canvas && options.html2canvas.scale) || 2,
          useCORS: (options.html2canvas && options.html2canvas.useCORS) !== false,
          logging: false,
          allowTaint: true
        }).then(function(canvas) {
          var jsPdfOpts = options.jsPDF || {};
          var pdf = new jsPDF({
            orientation: jsPdfOpts.orientation || 'portrait',
            unit: jsPdfOpts.unit || 'mm',
            format: jsPdfOpts.format || 'a4'
          });

          var margins = options.margin || 10;
          if (typeof margins === 'number') {
            margins = [margins, margins, margins, margins];
          } else if (Array.isArray(margins)) {
            if (margins.length === 2) margins = [margins[0], margins[1], margins[0], margins[1]];
            if (margins.length === 1) margins = [margins[0], margins[0], margins[0], margins[0]];
          }

          var imgData = canvas.toDataURL('image/' + (options.image && options.image.type || 'jpeg'), 
                                         options.image && options.image.quality || 0.98);
          var imgWidth = 210 - margins[1] - margins[3]; // A4 width minus left/right margins
          var imgHeight = (canvas.height * imgWidth) / canvas.width;
          var position = margins[0]; // Start from top margin
          var pageHeight = 297 - margins[0] - margins[2]; // A4 height minus top/bottom margins

          pdf.addImage(imgData, 'JPEG', margins[3], position, imgWidth, imgHeight);

          var heightLeft = imgHeight - pageHeight;
          while (heightLeft > 0) {
            position = heightLeft - imgHeight + margins[0];
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', margins[3], position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
          }

          pdf.save(filename);
        }).catch(function(err) {
          console.error('Error generating PDF:', err);
          fallbackPrint(element, filename);
        });
      } else {
        // Fallback to print dialog if libraries not available
        fallbackPrint(element, filename);
      }
    }

    function fallbackPrint(element, filename) {
      var content = element.innerHTML || element.outerHTML || 'No content';
      var printWindow = window.open('', '', 'height=600,width=800');
      if (printWindow) {
        printWindow.document.write('<html><head><title>' + filename + '</title></head><body>');
        printWindow.document.write(content);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        setTimeout(function() {
          printWindow.print();
        }, 250);
      } else {
        console.error('Could not open print window. Check popup blocker.');
        alert('PDF export not available. Please enable popups or use your browser\'s print function.');
      }
    }
  }
})(window);
